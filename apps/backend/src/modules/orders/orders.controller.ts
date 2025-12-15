import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './entities/order.entity';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * Создание нового заказа
   * POST /api/orders
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Создание нового заказа',
    description: 'Создает новый заказ с валидацией товаров и остатков',
  })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({
    status: 201,
    description: 'Заказ успешно создан',
    type: Order,
  })
  @ApiResponse({
    status: 400,
    description: 'Ошибка валидации или недостаточно товара на складе',
  })
  @ApiResponse({
    status: 404,
    description: 'Один или несколько товаров не найдены',
  })
  async create(
    @Body(ValidationPipe) createOrderDto: CreateOrderDto,
  ): Promise<Order> {
    // TODO: В будущем добавить извлечение userId из JWT токена
    // const userId = req.user?.id;
    const userId = undefined;

    return this.ordersService.create(createOrderDto, userId);
  }

  /**
   * Получение заказа по ID
   * GET /api/orders/:id
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Получение заказа по ID',
    description: 'Возвращает полную информацию о заказе с товарами',
  })
  @ApiParam({
    name: 'id',
    description: 'ID заказа',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Заказ найден',
    type: Order,
  })
  @ApiResponse({
    status: 404,
    description: 'Заказ не найден',
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Order> {
    // TODO: В будущем добавить проверку прав доступа
    // Если пользователь не авторизован - проверить по email из заказа
    // Если авторизован - проверить что заказ принадлежит пользователю или пользователь - админ

    return this.ordersService.findOne(id);
  }

  /**
   * Получение заказа по номеру
   * GET /api/orders/number/:orderNumber
   */
  @Get('number/:orderNumber')
  @ApiOperation({
    summary: 'Получение заказа по номеру',
    description: 'Возвращает заказ по уникальному номеру (ORD-20241129-0001)',
  })
  @ApiParam({
    name: 'orderNumber',
    description: 'Номер заказа',
    type: String,
    example: 'ORD-20241129-0001',
  })
  @ApiResponse({
    status: 200,
    description: 'Заказ найден',
    type: Order,
  })
  @ApiResponse({
    status: 404,
    description: 'Заказ не найден',
  })
  async findByOrderNumber(
    @Param('orderNumber') orderNumber: string,
  ): Promise<Order> {
    return this.ordersService.findByOrderNumber(orderNumber);
  }

  /**
   * Получение списка всех заказов (для админа)
   * GET /api/orders
   */
  @Get()
  @ApiOperation({
    summary: 'Получение списка заказов',
    description:
      'Возвращает список всех заказов с пагинацией и фильтрацией (только для администраторов)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Номер страницы',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Количество заказов на странице',
    example: 20,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Фильтр по статусу заказа',
    enum: [
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
    ],
    example: 'pending',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: Number,
    description: 'Фильтр по ID пользователя',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Список заказов',
    type: [Order],
  })
  @ApiResponse({
    status: 403,
    description: 'Доступ запрещен (требуются права администратора)',
  })
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status?: string,
    @Query('userId') userId?: string,
  ): Promise<{ data: Order[]; total: number; page: number; limit: number }> {
    // TODO: Добавить проверку роли администратора
    // @UseGuards(JwtAuthGuard, RolesGuard)
    // @Roles('admin')

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const userIdNum = userId ? parseInt(userId, 10) : undefined;

    return this.ordersService.findAll(pageNum, limitNum, status, userIdNum);
  }

  /**
   * Получение заказов текущего пользователя
   * GET /api/orders/my
   */
  @Get('my/orders')
  @ApiOperation({
    summary: 'Получение заказов текущего пользователя',
    description: 'Возвращает список заказов авторизованного пользователя',
  })
  @ApiResponse({
    status: 200,
    description: 'Список заказов пользователя',
    type: [Order],
  })
  @ApiResponse({
    status: 401,
    description: 'Пользователь не авторизован',
  })
  async findMyOrders(): Promise<Order[]> {
    // TODO: Добавить извлечение userId из JWT
    // @UseGuards(JwtAuthGuard)
    // const userId = req.user.id;

    const userId = 1; // Заглушка

    return this.ordersService.findByUser(userId);
  }
}
