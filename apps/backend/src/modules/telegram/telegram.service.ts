import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import TelegramBot from 'node-telegram-bot-api';
import { Order } from '../orders/entities/order.entity';

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private bot: TelegramBot | null = null;
  private adminChatId: string | null = null;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.initializeBot();
  }

  private initializeBot() {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    this.adminChatId =
      this.configService.get<string>('TELEGRAM_ADMIN_CHAT_ID') || null;

    if (!token) {
      this.logger.warn(
        'TELEGRAM_BOT_TOKEN not configured. Telegram notifications will be disabled.',
      );
      return;
    }

    if (!this.adminChatId) {
      this.logger.warn(
        'TELEGRAM_ADMIN_CHAT_ID not configured. Admin notifications will be disabled.',
      );
    }

    try {
      this.bot = new TelegramBot(token, { polling: false });
      this.logger.log('Telegram bot initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Telegram bot:', error);
    }
  }

  /**
   * Отправить уведомление администратору о новом заказе
   */
  async sendNewOrderNotification(order: Order): Promise<void> {
    if (!this.bot || !this.adminChatId) {
      this.logger.warn(
        'Telegram bot or admin chat ID not configured. Skipping notification.',
      );
      return;
    }

    try {
      const message = this.formatNewOrderMessage(order);
      const keyboard = this.createOrderInlineKeyboard(String(order.id));

      await this.bot.sendMessage(this.adminChatId, message, {
        parse_mode: 'HTML',
        reply_markup: keyboard,
      });

      this.logger.log(
        `Telegram notification sent for order #${order.id} to chat ${this.adminChatId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send Telegram notification for order #${order.id}:`,
        error,
      );
      // Не выбрасываем ошибку, чтобы не прерывать основной flow
    }
  }

  /**
   * Форматировать сообщение о новом заказе
   */
  private formatNewOrderMessage(order: Order): string {
    const orderNumber = order.id;
    const total = order.totalAmount.toFixed(2);
    const customerName = order.customerName || 'Не указано';
    const email = order.customerEmail || 'Не указан';
    const phone = order.customerPhone || 'Не указан';

    // Формируем список товаров
    const items =
      order.items
        ?.map((item, index) => {
          const productName = item.product?.name || 'Товар';
          const quantity = item.quantity;
          const itemTotal = item.total.toFixed(2);
          return `${index + 1}. ${productName} × ${quantity} шт. = ${itemTotal} ₽`;
        })
        .join('\n') || 'Нет товаров';

    // Адрес доставки
    const shippingAddress = this.getShippingAddress(order);

    // Способ оплаты
    const paymentMethod = this.getPaymentMethodText(order);

    return `
🛒 <b>Новый заказ #${orderNumber}</b>

💰 <b>Сумма:</b> ${total} ₽

👤 <b>Клиент:</b> ${customerName}
📧 <b>Email:</b> ${email}
📞 <b>Телефон:</b> ${phone}

📦 <b>Товары:</b>
${items}

📍 <b>Адрес доставки:</b>
${shippingAddress}

💳 <b>Способ оплаты:</b> ${paymentMethod}

🕐 <b>Время заказа:</b> ${new Date(order.createdAt).toLocaleString('ru-RU')}
    `.trim();
  }

  /**
   * Создать inline клавиатуру для заказа
   */
  private createOrderInlineKeyboard(
    orderId: string,
  ): TelegramBot.InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        [
          {
            text: '👁 Просмотреть',
            url: `${this.getAdminUrl()}/orders/${orderId}`,
          },
          {
            text: '✅ Принять в работу',
            callback_data: `accept_order_${orderId}`,
          },
        ],
      ],
    };
  }

  /**
   * Получить адрес доставки из заказа
   */
  private getShippingAddress(order: Order): string {
    const shipping = order.shippingAddress;
    if (!shipping) return 'Не указан';

    if (typeof shipping === 'string') return shipping;

    // Собираем адрес из частей JSONB
    const parts = [
      shipping.street,
      shipping.city,
      shipping.region,
      shipping.postalCode,
      shipping.country,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(', ') : 'Не указан';
  }

  /**
   * Получить текстовое представление способа оплаты
   */
  private getPaymentMethodText(order: Order): string {
    const method = order.metadata?.paymentMethod as string | undefined;

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
   * Получить URL админ-панели
   */
  private getAdminUrl(): string {
    return (
      this.configService.get<string>('ADMIN_PANEL_URL') ||
      'http://localhost:3000/admin'
    );
  }

  /**
   * Обработчик callback кнопок (для будущего расширения)
   */
  setupCallbackHandlers() {
    if (!this.bot) return;

    this.bot.on('callback_query', async (callbackQuery) => {
      const data = callbackQuery.data;
      const chatId = callbackQuery.message?.chat.id;

      if (!data || !chatId) return;

      try {
        if (data.startsWith('accept_order_')) {
          const orderId = data.replace('accept_order_', '');

          await this.bot?.answerCallbackQuery(callbackQuery.id, {
            text: `Заказ #${orderId} принят в работу!`,
          });

          await this.bot?.sendMessage(
            chatId,
            `✅ Заказ #${orderId} принят в работу`,
          );

          this.logger.log(
            `Order #${orderId} accepted via Telegram by chat ${chatId}`,
          );
        }
      } catch (error) {
        this.logger.error('Error handling callback query:', error);
      }
    });
  }
}
