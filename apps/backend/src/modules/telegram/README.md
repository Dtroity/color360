# Telegram Bot Service

Сервис для отправки уведомлений администратору через Telegram Bot API.

## Установка

Зависимости уже установлены:
- `node-telegram-bot-api ^0.66.0` - библиотека для работы с Telegram Bot API
- `@types/node-telegram-bot-api ^0.64.13` - TypeScript типы

## Конфигурация

### 1. Создание Telegram бота

1. Откройте Telegram и найдите [@BotFather](https://t.me/BotFather)
2. Отправьте команду `/newbot`
3. Следуйте инструкциям для создания бота
4. Получите токен бота (формат: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Получение Chat ID администратора

**Вариант 1 - через @userinfobot:**
1. Найдите бота [@userinfobot](https://t.me/userinfobot)
2. Отправьте любое сообщение
3. Скопируйте ваш `Id` (числовой идентификатор)

**Вариант 2 - через @getmyid_bot:**
1. Найдите бота [@getmyid_bot](https://t.me/getmyid_bot)
2. Отправьте `/start`
3. Скопируйте `Your user ID`

**Вариант 3 - через API:**
```bash
# Отправьте сообщение вашему боту, затем выполните:
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
```

### 3. Настройка .env файла

Добавьте в `.env`:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_ADMIN_CHAT_ID=123456789
ADMIN_PANEL_URL=http://localhost:3000/admin
```

**Важно:**
- `TELEGRAM_BOT_TOKEN` - обязательный параметр
- `TELEGRAM_ADMIN_CHAT_ID` - обязательный для уведомлений
- `ADMIN_PANEL_URL` - опционально, для ссылок в кнопках

## Архитектура

### TelegramService

Основной сервис для работы с Telegram Bot API.

#### Методы

**`sendNewOrderNotification(order: Order): Promise<void>`**

Отправляет уведомление администратору о новом заказе.

**Формат сообщения:**
```
🛒 Новый заказ #12345

💰 Сумма: 15000.00 ₽

👤 Клиент: Иван Иванов
📧 Email: ivan@example.com
📞 Телефон: +7 (999) 123-45-67

📦 Товары:
1. Камера DS-2CD2043G0-I × 2 шт. = 8500.00 ₽
2. Видеорегистратор DS-7608NI-K2 × 1 шт. = 6500.00 ₽

📍 Адрес доставки:
ул. Ленина, д. 10, кв. 5, Москва, 101000, Россия

💳 Способ оплаты: Банковская карта

🕐 Время заказа: 29.11.2025, 14:30:00
```

**Inline кнопки:**
- 👁 **Просмотреть** - ссылка на детали заказа в админ-панели
- ✅ **Принять в работу** - callback для принятия заказа

**`setupCallbackHandlers()`**

Настраивает обработчики для callback кнопок (вызывается опционально).

## Использование

### В OrdersService

```typescript
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class OrdersService {
  constructor(private telegramService: TelegramService) {}

  async createOrder(createOrderDto: CreateOrderDto) {
    const order = await this.ordersRepository.save(newOrder);

    // Загрузить заказ с relations
    const orderWithRelations = await this.ordersRepository.findOne({
      where: { id: order.id },
      relations: ['items', 'items.product'],
    });

    try {
      // Отправить Telegram уведомление
      await this.telegramService.sendNewOrderNotification(orderWithRelations);
    } catch (error) {
      this.logger.error('Failed to send Telegram notification:', error);
      // Продолжаем выполнение, ошибка не критична
    }

    return order;
  }
}
```

### Совместно с EmailService

```typescript
async createOrder(createOrderDto: CreateOrderDto) {
  const order = await this.ordersRepository.save(newOrder);
  
  const orderWithRelations = await this.ordersRepository.findOne({
    where: { id: order.id },
    relations: ['items', 'items.product', 'user'],
  });

  try {
    // Email клиенту
    await this.emailService.sendOrderConfirmation(
      orderWithRelations,
      orderWithRelations.customerEmail,
    );

    // Email администратору
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    if (adminEmail) {
      await this.emailService.sendNewOrderNotification(
        orderWithRelations,
        adminEmail,
      );
    }

    // Telegram администратору
    await this.telegramService.sendNewOrderNotification(orderWithRelations);
  } catch (error) {
    this.logger.error('Failed to send notifications:', error);
  }

  return order;
}
```

## Особенности реализации

### Безопасная обработка данных

Сервис использует вспомогательные методы для извлечения данных из Order:

**`getShippingAddress(order: Order): string`**
- Обрабатывает JSONB поле `shippingAddress`
- Поддерживает как строковый формат, так и объект с полями

**`getPaymentMethodText(order: Order): string`**
- Извлекает `paymentMethod` из `metadata` (JSONB)
- Преобразует в читаемый текст на русском языке

### Форматирование сообщений

Используется **HTML parsing mode** для форматирования:
- `<b>` для жирного текста
- Emoji для визуального оформления
- Структурированная информация для быстрого чтения

### Inline кнопки

**Кнопка "Просмотреть":**
```typescript
{
  text: '👁 Просмотреть',
  url: `${ADMIN_PANEL_URL}/orders/${orderId}`,
}
```

**Кнопка "Принять в работу":**
```typescript
{
  text: '✅ Принять в работу',
  callback_data: `accept_order_${orderId}`,
}
```

### Callback обработчики

Метод `setupCallbackHandlers()` настраивает обработку нажатий кнопок:

```typescript
// В main.ts или в OrdersModule
const telegramService = app.get(TelegramService);
telegramService.setupCallbackHandlers();
```

При нажатии "Принять в работу":
1. Отправляется ответ на callback query
2. Отправляется подтверждающее сообщение в чат
3. Логируется действие

## Обработка ошибок

Сервис логирует все ошибки, но не прерывает основной flow:

**Bot не настроен:**
```
[TelegramService] TELEGRAM_BOT_TOKEN not configured. Telegram notifications will be disabled.
```

**Chat ID не настроен:**
```
[TelegramService] TELEGRAM_ADMIN_CHAT_ID not configured. Admin notifications will be disabled.
```

**Ошибка отправки:**
```
[TelegramService] Failed to send Telegram notification for order #12345: <details>
```

Все ошибки не выбрасываются наружу, чтобы не прерывать создание заказа.

## Режим polling vs webhook

По умолчанию используется режим **без polling** (`polling: false`):
- Бот НЕ проверяет обновления автоматически
- Подходит для отправки уведомлений (один из способов)
- Минимальное потребление ресурсов

Для полноценной работы callback кнопок рекомендуется:
1. Включить polling: `new TelegramBot(token, { polling: true })`
2. Или настроить webhook для production

## Best Practices

✅ **Всегда загружайте relations**: `['items', 'items.product']`  
✅ **Используйте try-catch**: Не ломайте основной flow при ошибке Telegram  
✅ **Проверяйте .env**: Убедитесь что токен и chat_id настроены  
✅ **Тестируйте на реальном боте**: Создайте тестового бота для разработки  
✅ **HTML форматирование**: Используйте `<b>`, избегайте Markdown конфликтов  
✅ **Короткие сообщения**: Telegram имеет лимит 4096 символов  

## Ограничения Telegram API

- **Максимум текста:** 4096 символов (текущая реализация не превышает)
- **Rate limits:** ~30 сообщений/секунду на бота
- **Inline кнопки:** до 100 кнопок, `callback_data` до 64 байт
- **HTML теги:** поддерживаются `<b>`, `<i>`, `<u>`, `<s>`, `<code>`, `<pre>`, `<a>`

## Расширение функциональности

### Добавление новых типов уведомлений

Создайте новые методы в `TelegramService`:

```typescript
async sendOrderStatusUpdate(order: Order): Promise<void> {
  if (!this.bot || !this.adminChatId) return;

  const message = `
🔄 Статус заказа #${order.id} изменён

Новый статус: ${this.getStatusEmoji(order.status)} ${order.status}
  `.trim();

  await this.bot.sendMessage(this.adminChatId, message, {
    parse_mode: 'HTML',
  });
}

private getStatusEmoji(status: string): string {
  const emojiMap = {
    pending: '⏳',
    processing: '⚙️',
    shipped: '🚚',
    delivered: '✅',
    cancelled: '❌',
  };
  return emojiMap[status] || '📦';
}
```

### Групповые чаты

Для отправки в группу:
1. Добавьте бота в группу
2. Сделайте бота администратором (необязательно)
3. Получите chat_id группы (отрицательное число)
4. Используйте этот chat_id в `TELEGRAM_ADMIN_CHAT_ID`

### Множественные получатели

Создайте массив chat_id:

```typescript
private adminChatIds: string[] = [];

private initializeBot() {
  const chatIdsString = this.configService.get<string>('TELEGRAM_ADMIN_CHAT_IDS');
  this.adminChatIds = chatIdsString?.split(',') || [];
}

async sendNewOrderNotification(order: Order): Promise<void> {
  for (const chatId of this.adminChatIds) {
    await this.bot.sendMessage(chatId, message, options);
  }
}
```

## Тестирование

### Локальное тестирование

1. Создайте тестового бота у @BotFather
2. Получите свой chat_id
3. Настройте `.env.local`:
```env
TELEGRAM_BOT_TOKEN=<test_bot_token>
TELEGRAM_ADMIN_CHAT_ID=<your_chat_id>
```

4. Создайте тестовый заказ через API
5. Проверьте получение уведомления

### Интеграционные тесты

```typescript
describe('TelegramService', () => {
  it('should send order notification', async () => {
    const mockOrder = {
      id: 1,
      totalAmount: 10000,
      customerName: 'Test User',
      items: [/* ... */],
    };

    await telegramService.sendNewOrderNotification(mockOrder);
    
    // Проверьте логи или mock вызовы
  });
});
```

## Структура файлов

```
telegram/
├── telegram.service.ts    # Основной сервис с отправкой уведомлений
├── telegram.module.ts     # NestJS модуль
└── README.md             # Документация
```

## Безопасность

⚠️ **Важно:**
- Никогда не коммитьте `.env` с реальными токенами
- Используйте разные боты для dev/staging/production
- Ограничьте доступ к боту (не делайте публичным)
- Регулярно ротируйте токены через @BotFather
- Не передавайте токены через URL или логи

## Полезные ссылки

- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [node-telegram-bot-api на GitHub](https://github.com/yagop/node-telegram-bot-api)
- [BotFather - создание ботов](https://t.me/BotFather)
- [Получение Chat ID](https://t.me/userinfobot)
