import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../catalog/products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    private readonly dataSource: DataSource,
    private readonly telegramService: TelegramService,
  ) {}

  /**
   * Создание заказа с транзакцией
   */
  async create(createOrderDto: CreateOrderDto, user?: User): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Генерация уникального номера заказа
      const orderNumber = await this.generateOrderNumber();

      // 2. Проверка остатков и загрузка товаров
      const products = await this.validateAndLoadProducts(
        createOrderDto.items,
        queryRunner.manager,
      );

      // 3. Subtotal
      const subtotal = createOrderDto.items.reduce((sum, item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) throw new Error(`Product not found: ${item.productId}`);
        return sum + product.price * item.quantity;
      }, 0);

      // 4. Стоимость доставки
      const deliveryCost = this.calculateDeliveryCost(
        createOrderDto.deliveryMethod,
      );

      // 5. Итоговая сумма
      const totalAmount = subtotal + deliveryCost;

      // 6. Создание Order
      const order = queryRunner.manager.create(Order, {
        orderNumber,
        status: OrderStatus.PENDING,
        totalAmount,
        currency: 'RUB',

        customerName: `${createOrderDto.firstName} ${createOrderDto.lastName}`,
        customerEmail: createOrderDto.email,
        customerPhone: createOrderDto.phone,

        shippingAddress: {
          method: createOrderDto.deliveryMethod,
          city: createOrderDto.city,
          address: createOrderDto.address,
          deliveryDate: createOrderDto.deliveryDate,
        },

        metadata: {
          paymentMethod: createOrderDto.paymentMethod,
          companyInn: createOrderDto.companyInn,
          companyName: createOrderDto.companyName,
          subtotal,
          deliveryCost,
        },

        comment: createOrderDto.comment,
        user: user ?? null, // связь с пользователем
      } as Partial<Order>);

      const savedOrder = await queryRunner.manager.save(Order, order);

      // 7. OrderItem — позиции заказа
      const orderItems = createOrderDto.items.map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) {
          throw new Error(
            `Product ${item.productId} not found during order creation`,
          );
        }

        return queryRunner.manager.create(OrderItem, {
          order: savedOrder,
          product,
          quantity: item.quantity,
          price: product.price,
          total: product.price * item.quantity,
        });
      });

      await queryRunner.manager.save(OrderItem, orderItems);

      // 8. Уменьшение остатков
      for (const item of createOrderDto.items) {
        await queryRunner.manager.decrement(
          Product,
          { id: item.productId },
          'stock',
          item.quantity,
        );
      }

      // 9. Коммит
      await queryRunner.commitTransaction();

      // 10. Возвращаем заказ с relations
      const createdOrder = await this.orderRepository.findOne({
        where: { id: savedOrder.id },
        relations: ['items', 'items.product', 'user'],
      });

      if (!createdOrder) throw new Error('Failed to load created order');

      // 11. Отправляем уведомление в Telegram (не блокируем основной flow при ошибке)
      try {
        await this.telegramService.sendNewOrderNotification(createdOrder);
      } catch (error) {
        this.logger.error('Failed to send Telegram notification:', error);
        // Не выбрасываем ошибку, чтобы не прерывать создание заказа
      }

      return createdOrder;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Генерация номера заказа
   */
  private async generateOrderNumber(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const datePrefix = `${year}${month}${day}`;

    const lastOrder = await this.orderRepository
      .createQueryBuilder('order')
      .where('order.orderNumber LIKE :prefix', {
        prefix: `ORD-${datePrefix}-%`,
      })
      .orderBy('order.orderNumber', 'DESC')
      .getOne();

    let sequence = 1;

    if (lastOrder) {
      const lastSequence = lastOrder.orderNumber.split('-')[2];
      sequence = parseInt(lastSequence, 10) + 1;
    }

    const sequenceStr = String(sequence).padStart(4, '0');
    return `ORD-${datePrefix}-${sequenceStr}`;
  }

  /**
   * Проверка остатков
   */
  private async validateAndLoadProducts(
    items: { productId: number; quantity: number }[],
    manager: any,
  ): Promise<Product[]> {
    const productIds = items.map((item) => item.productId);

    const products = await manager.find(Product, {
      where: productIds.map((id) => ({ id })),
    });

    if (products.length !== productIds.length) {
      const foundIds = products.map((p) => p.id);
      const missingIds = productIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `Товары с ID ${missingIds.join(', ')} не найдены`,
      );
    }

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);

      if (product.stock <= 0) {
        throw new BadRequestException(
          `Товар "${product.name}" отсутствует в наличии`,
        );
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Недостаточно товара "${product.name}". Доступно: ${product.stock}, запрошено: ${item.quantity}`,
        );
      }
    }

    return products;
  }

  /**
   * Стоимость доставки
   */
  private calculateDeliveryCost(deliveryMethod: string): number {
    switch (deliveryMethod) {
      case 'courier':
        return 500;
      case 'pickup':
        return 0;
      case 'transport':
        return 0;
      default:
        return 0;
    }
  }

  /**
   * Заказ по ID
   */
  async findOne(id: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'user'],
    });

    if (!order) {
      throw new NotFoundException(`Заказ с ID ${id} не найден`);
    }

    return order;
  }

  /**
   * Заказ по номеру
   */
  async findByOrderNumber(orderNumber: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { orderNumber },
      relations: ['items', 'items.product', 'user'],
    });

    if (!order) {
      throw new NotFoundException(`Заказ ${orderNumber} не найден`);
    }

    return order;
  }

  /**
   * Заказы пользователя (основной метод)
   */
  async findUserOrders(userId: number) {
    return this.orderRepository.find({
      where: { user: { id: userId } },
      relations: ['items', 'items.product', 'user'],
    });
  }

  /**
   * Алиас, чтобы не ломать контроллер
   */
  async findByUser(userId: number) {
    return this.findUserOrders(userId);
  }

  /**
   * Обновление статуса заказа
   */
  async updateStatus(id: number, status: string): Promise<Order> {
    const order = await this.findOne(id);
    order.status = status as OrderStatus;
    return this.orderRepository.save(order);
  }

  /**
   * Обновление статуса оплаты
   */
  async updatePaymentStatus(id: number, paymentStatus: string): Promise<Order> {
    const order = await this.findOne(id);

    if (!order.metadata) order.metadata = {};
    order.metadata.paymentStatus = paymentStatus;

    if (paymentStatus === 'paid') {
      order.metadata.paidAt = new Date().toISOString();
    }

    return this.orderRepository.save(order);
  }

  /**
   * Все заказы (фильтры + пагинация)
   */
  async findAll(
    page: number = 1,
    limit: number = 20,
    status?: string,
    userId?: number,
  ): Promise<{ data: Order[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('order.user', 'user')
      .skip(skip)
      .take(limit)
      .orderBy('order.createdAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
    }

    if (userId) {
      queryBuilder.andWhere('user.id = :userId', { userId });
    }

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }
}
