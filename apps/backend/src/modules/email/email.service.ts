import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import * as Handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Order } from '../orders/entities/order.entity';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;
  private templates: Map<string, Handlebars.TemplateDelegate> = new Map();

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
    this.loadTemplates();
  }

  private loadTemplates() {
    // В dev режиме читаем из src, в prod - из dist
    const isDev = process.env.NODE_ENV === 'development';
    const templatesDir = isDev
      ? join(process.cwd(), 'src', 'modules', 'email', 'templates')
      : join(__dirname, 'templates');
      
    const templateFiles = [
      'order-confirmation.hbs',
      'order-status-update.hbs',
      'new-order-notification.hbs',
    ];

    templateFiles.forEach((file) => {
      try {
        const templatePath = join(templatesDir, file);
        const templateContent = readFileSync(templatePath, 'utf-8');
        const templateName = file.replace('.hbs', '');
        this.templates.set(templateName, Handlebars.compile(templateContent));
        this.logger.log(`Loaded email template: ${templateName}`);
      } catch (error) {
        this.logger.error(`Failed to load template ${file}:`, error);
      }
    });
  }

  private initializeTransporter() {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT', 587);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASSWORD');

    if (!host || !user || !pass) {
      this.logger.warn(
        'SMTP credentials not configured. Email sending will be disabled.',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    // Verify connection
    this.transporter.verify((error) => {
      if (error) {
        this.logger.error('SMTP connection failed:', error);
      } else {
        this.logger.log('SMTP server is ready to send emails');
      }
    });
  }

  /**
   * Отправка подтверждения заказа клиенту
   */
  async sendOrderConfirmation(
    order: Order,
    customerEmail: string,
  ): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(
        'Email transporter not configured. Skipping order confirmation email.',
      );
      return;
    }

    try {
      const template = this.templates.get('order-confirmation');
      if (!template) {
        throw new Error('Order confirmation template not found');
      }

      const context = this.prepareOrderConfirmationContext(order);
      const html = template(context);

      await this.transporter.sendMail({
        to: customerEmail,
        subject: `Подтверждение заказа №${order.id}`,
        html,
      });

      this.logger.log(
        `Order confirmation email sent to ${customerEmail} for order #${order.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send order confirmation email to ${customerEmail}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Отправка уведомления об изменении статуса заказа
   */
  async sendOrderStatusUpdate(
    order: Order,
    customerEmail: string,
  ): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(
        'Email transporter not configured. Skipping order status update email.',
      );
      return;
    }

    try {
      const template = this.templates.get('order-status-update');
      if (!template) {
        throw new Error('Order status update template not found');
      }

      const context = this.prepareOrderStatusUpdateContext(order);
      const html = template(context);

      await this.transporter.sendMail({
        to: customerEmail,
        subject: `Обновление статуса заказа №${order.id}`,
        html,
      });

      this.logger.log(
        `Order status update email sent to ${customerEmail} for order #${order.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send order status update email to ${customerEmail}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Отправка уведомления администратору о новом заказе
   */
  async sendNewOrderNotification(
    order: Order,
    adminEmail: string,
  ): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(
        'Email transporter not configured. Skipping new order notification email.',
      );
      return;
    }

    try {
      const template = this.templates.get('new-order-notification');
      if (!template) {
        throw new Error('New order notification template not found');
      }

      const context = this.prepareNewOrderNotificationContext(order);
      const html = template(context);

      await this.transporter.sendMail({
        to: adminEmail,
        subject: `Новый заказ №${order.id} на сумму ${order.totalAmount.toFixed(2)} ₽`,
        html,
      });

      this.logger.log(
        `New order notification email sent to admin ${adminEmail} for order #${order.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send new order notification email to ${adminEmail}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Подготовить контекст для шаблона подтверждения заказа
   */
  private prepareOrderConfirmationContext(order: Order) {
    const subtotal = this.calculateSubtotal(order);
    const deliveryCost = Number(this.getMetadata(order, 'deliveryCost')) || 0;
    const deliveryDate = this.getMetadata(order, 'deliveryDate');
    const paymentMethod = this.getMetadata(order, 'paymentMethod');

    return {
      orderId: order.id,
      customerName: order.customerName,
      orderDate: order.createdAt.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      statusText: this.getStatusText(order.status),
      items: order.items.map((item) => ({
        productName: item.product?.name || '�����',
        quantity: item.quantity,
        price: item.price.toFixed(2),
        total: item.total.toFixed(2),
      })),
      subtotal: subtotal.toFixed(2),
      deliveryCost: deliveryCost > 0 ? deliveryCost.toFixed(2) : null,
      totalAmount: order.totalAmount.toFixed(2),
      shippingAddress: this.getAddress(order, 'shippingAddress'),
      deliveryDate: deliveryDate
        ? new Date(deliveryDate as string).toLocaleDateString('ru-RU')
        : null,
      paymentMethod: this.getPaymentMethodText(paymentMethod as string),
      companyName: (this.getMetadata(order, 'companyName') as string) || null,
      companyInn: (this.getMetadata(order, 'companyInn') as string) || null,
      comment: order.comment || null,
      currentYear: new Date().getFullYear(),
    };
  }

  /**
   * Подготовить контекст для шаблона обновления статуса
   */
  private prepareOrderStatusUpdateContext(order: Order) {
    const deliveryDate = this.getMetadata(order, 'deliveryDate');

    return {
      orderId: order.id,
      customerName: order.customerName,
      orderDate: order.createdAt.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      statusText: this.getStatusText(order.status),
      statusColor: this.getStatusColor(order.status),
      statusMessage: this.getStatusMessageText(order.status),
      totalAmount: order.totalAmount.toFixed(2),
      items: order.items.map((item) => ({
        productName: item.product?.name || 'Товар',
        quantity: item.quantity,
        total: item.total.toFixed(2),
      })),
      shippingAddress: this.getAddress(order, 'shippingAddress') || null,
      deliveryDate: deliveryDate
        ? new Date(deliveryDate as string).toLocaleDateString('ru-RU')
        : null,
      currentYear: new Date().getFullYear(),
    };
  }

  /**
   * Подготовить контекст для уведомления администратора
   */
  private prepareNewOrderNotificationContext(order: Order) {
    const subtotal = this.calculateSubtotal(order);
    const deliveryCost = Number(this.getMetadata(order, 'deliveryCost')) || 0;
    const deliveryDate = this.getMetadata(order, 'deliveryDate');
    const paymentMethod = this.getMetadata(order, 'paymentMethod');

    return {
      orderId: order.id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      orderDate: order.createdAt.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      statusText: this.getStatusText(order.status),
      items: order.items.map((item) => ({
        productName: item.product?.name || '�����',
        quantity: item.quantity,
        price: item.price.toFixed(2),
        total: item.total.toFixed(2),
      })),
      subtotal: subtotal.toFixed(2),
      deliveryCost: deliveryCost > 0 ? deliveryCost.toFixed(2) : null,
      totalAmount: order.totalAmount.toFixed(2),
      shippingAddress: this.getAddress(order, 'shippingAddress'),
      paymentMethod: this.getPaymentMethodText(paymentMethod as string),
      deliveryDate: deliveryDate
        ? new Date(deliveryDate as string).toLocaleDateString('ru-RU')
        : null,
      companyName: (this.getMetadata(order, 'companyName') as string) || null,
      companyInn: (this.getMetadata(order, 'companyInn') as string) || null,
      comment: order.comment || null,
      currentYear: new Date().getFullYear(),
    };
  }

  /**
   * Получить текст сообщения для статуса (для Handlebars)
   */
  private getStatusMessageText(status: string): string {
    const messages: Record<string, string> = {
      pending:
        'Ваш заказ ожидает обработки. Мы скоро начнём его обрабатывать и уведомим вас о следующих этапах.',
      processing:
        'Ваш заказ в обработке. Мы готовим ваш заказ к отправке. Скоро он будет отправлен.',
      shipped:
        'Ваш заказ отправлен! Заказ в пути. Ожидайте доставку в ближайшее время.',
      delivered:
        'Ваш заказ доставлен! Спасибо за покупку! Будем рады видеть вас снова.',
      cancelled:
        'Ваш заказ отменён. Если у вас есть вопросы, пожалуйста, свяжитесь с нами.',
    };
    return (
      messages[status] ||
      'Статус вашего заказа изменился. Следите за обновлениями.'
    );
  }

  /**
   * Получить текстовое представление статуса
   */
  private getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      pending: 'Ожидает обработки',
      processing: 'В обработке',
      shipped: 'Отправлен',
      delivered: 'Доставлен',
      cancelled: 'Отменён',
    };
    return statusMap[status] || status;
  }

  /**
   * Получить цвет для статуса
   */
  private getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      pending: '#ffa726',
      processing: '#42a5f5',
      shipped: '#ab47bc',
      delivered: '#66bb6a',
      cancelled: '#ef5350',
    };
    return colors[status] || '#999999';
  }

  /**
   * Получить текстовое представление способа оплаты
   */
  private getPaymentMethodText(method?: string): string {
    if (!method) return 'Не указан';
    const methodMap: Record<string, string> = {
      cash: 'Наличные при получении',
      card: 'Банковская карта',
      online: 'Онлайн оплата',
      invoice: 'По счёту для юр. лиц',
    };
    return methodMap[method] || method;
  }

  /**
   * Получить значение из metadata
   */
  private getMetadata(order: Order, key: string): unknown {
    return order.metadata?.[key];
  }

  /**
   * Получить адрес доставки
   */
  private getAddress(
    order: Order,
    addressType: 'shippingAddress' | 'billingAddress' = 'shippingAddress',
  ): string {
    const address = order[addressType];
    if (!address) return 'Не указан';
    if (typeof address === 'string') return address;
    // Собрать адрес из частей
    const parts = [
      address.street,
      address.city,
      address.region,
      address.postalCode,
      address.country,
    ].filter(Boolean);
    return parts.join(', ') || 'Не указан';
  }

  /**
   * Вычислить subtotal из items
   */
  private calculateSubtotal(order: Order): number {
    return order.items?.reduce((sum, item) => sum + item.total, 0) || 0;
  }
}
