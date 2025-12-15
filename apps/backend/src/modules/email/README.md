# Email Service

Сервис для отправки email уведомлений с использованием **Handlebars** шаблонов и **nodemailer**.

## Установка

Зависимости уже установлены:
- `nodemailer ^7.0.11` - библиотека для отправки email
- `handlebars ^4.7.8` - шаблонизатор для HTML писем
- `@types/nodemailer ^7.0.4` - TypeScript типы

## Конфигурация

Добавьте SMTP настройки в `.env` файл:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com

# Admin Email for notifications
ADMIN_EMAIL=admin@videoshop.com
```

### Примеры настроек для популярных провайдеров:

**Gmail:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # Используйте App Password!
```

**Yandex:**
```env
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_USER=your-email@yandex.ru
SMTP_PASSWORD=your-password
```

**Mail.ru:**
```env
SMTP_HOST=smtp.mail.ru
SMTP_PORT=465
SMTP_USER=your-email@mail.ru
SMTP_PASSWORD=your-password
```

## Архитектура с Handlebars

### Шаблоны в `templates/`

Email шаблоны хранятся в `templates/` и используют Handlebars:

- **`order-confirmation.hbs`** - Подтверждение заказа клиенту
- **`order-status-update.hbs`** - Уведомление об изменении статуса
- **`new-order-notification.hbs`** - Уведомление администратору о новом заказе

**Особенности:**
- Полностью responsive (мобильная адаптация)
- Inline CSS для совместимости с email клиентами
- Условное отображение: `{{#if comment}}...{{/if}}`
- Итераторы: `{{#each items}}...{{/each}}`
- Переменные: `{{orderId}}`, `{{customerName}}`, `{{totalAmount}}`

### Методы сервиса

#### `sendOrderConfirmation(order: Order, customerEmail: string)`
Подтверждение заказа клиенту сразу после оформления.

**Контекст:**
- `orderId`, `customerName`, `orderDate`, `statusText`
- `items[]` - список товаров с `productName`, `quantity`, `price`, `total`
- `subtotal`, `deliveryCost`, `totalAmount`
- `shippingAddress`, `deliveryDate`, `paymentMethod`
- `companyName`, `companyInn` (для юр. лиц)
- `comment` (опционально)

#### `sendOrderStatusUpdate(order: Order, customerEmail: string)`
Уведомление об изменении статуса заказа.

**Контекст:**
- `statusText`, `statusColor`, `statusMessage`
- `orderId`, `orderDate`, `totalAmount`
- `items[]` - упрощенный список товаров
- `shippingAddress`, `deliveryDate`

#### `sendNewOrderNotification(order: Order, adminEmail: string)`
Уведомление администратору о новом заказе.

**Контекст:**
- Полная информация о клиенте: `customerName`, `customerEmail`, `customerPhone`
- `items[]` - детальный список с ценами
- `subtotal`, `deliveryCost`, `totalAmount`
- `shippingAddress`, `paymentMethod`, `deliveryDate`
- `companyName`, `companyInn`, `comment`

## Использование

### В OrdersService

```typescript
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OrdersService {
  constructor(
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto) {
    const order = await this.ordersRepository.save(newOrder);

    // Загрузка с relations для email
    const orderWithRelations = await this.ordersRepository.findOne({
      where: { id: order.id },
      relations: ['items', 'items.product', 'user'],
    });

    try {
      // Клиенту
      await this.emailService.sendOrderConfirmation(
        orderWithRelations,
        orderWithRelations.customerEmail,
      );

      // Администратору
      const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
      if (adminEmail) {
        await this.emailService.sendNewOrderNotification(
          orderWithRelations,
          adminEmail,
        );
      }
    } catch (error) {
      this.logger.error('Failed to send emails:', error);
    }

    return order;
  }

  async updateOrderStatus(id: string, status: OrderStatus) {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['items', 'items.product'],
    });

    order.status = status;
    await this.ordersRepository.save(order);

    try {
      await this.emailService.sendOrderStatusUpdate(
        order,
        order.customerEmail,
      );
    } catch (error) {
      this.logger.error('Failed to send status update:', error);
    }

    return order;
  }
}
```

## Работа с Order Metadata

Order entity использует JSONB для дополнительных данных:

**`metadata` (JSONB):**
```typescript
{
  paymentMethod: 'cash' | 'card' | 'online' | 'invoice';
  deliveryDate: string;  // ISO date
  deliveryCost: number;
  companyName?: string;  // для юр. лиц
  companyInn?: string;
}
```

**`shippingAddress` (JSONB):**
```typescript
{
  street: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}
```

**Вспомогательные методы:**
- `getMetadata(order, key)` - безопасное извлечение из metadata
- `getAddress(order, 'shippingAddress')` - сборка адреса из JSONB
- `calculateSubtotal(order)` - сумма всех items без доставки

## Кастомизация шаблонов

### Редактирование .hbs файлов

1. Откройте нужный файл в `templates/`
2. Измените HTML (используйте **ТОЛЬКО inline CSS**)
3. Переменные Handlebars доступны из контекста:

```handlebars
<p>Заказ №{{orderId}}</p>
<p>Клиент: {{customerName}}</p>
<p>Сумма: {{totalAmount}} ₽</p>

{{#each items}}
  <li>{{this.productName}} - {{this.quantity}} шт. = {{this.total}} ₽</li>
{{/each}}

{{#if comment}}
  <p>Комментарий: {{comment}}</p>
{{/if}}
```

### Добавление новых переменных

В `email.service.ts` обновите метод `prepare*Context()`:

```typescript
private prepareOrderConfirmationContext(order: Order) {
  return {
    // ... existing
    myCustomField: order.metadata?.myCustomField || 'default',
  };
}
```

Используйте в шаблоне:
```handlebars
<p>Custom: {{myCustomField}}</p>
```

## Обработка ошибок

Сервис логирует ошибки, но не прерывает основной flow:

**SMTP не настроен:**
```
[EmailService] SMTP credentials not configured. Email sending will be disabled.
```

**Ошибка отправки:**
```
[EmailService] Failed to send order confirmation email to user@example.com: <details>
```

**Шаблон не найден:**
```
[EmailService] Failed to load template order-confirmation.hbs: <details>
```

## Best Practices

✅ **Всегда загружайте relations**: `['items', 'items.product']`  
✅ **Используйте try-catch**: Не ломайте основной flow при ошибке email  
✅ **Проверяйте .env**: Убедитесь что SMTP настроен в production  
✅ **Тестируйте на разных клиентах**: Gmail, Outlook, Apple Mail, Thunderbird  
✅ **ТОЛЬКО inline CSS**: Email клиенты не поддерживают `<style>` теги  
✅ **Без JavaScript**: Email клиенты блокируют скрипты  
✅ **Mobile-first**: Используйте responsive таблицы с `max-width`  

## Преимущества Handlebars

Миграция с embedded HTML templates на Handlebars дает:

- ✅ **Разделение логики и представления** - TypeScript vs HTML
- ✅ **Простое редактирование дизайнерами** - не нужен TypeScript
- ✅ **Переиспользование** - общие компоненты/helpers
- ✅ **Type-safety** - контекст типизирован при подготовке
- ✅ **Читаемость** - чистый HTML без escape-последовательностей
- ✅ **Maintainability** - легко находить и обновлять шаблоны

## Структура файлов

```
email/
├── templates/
│   ├── order-confirmation.hbs       # Подтверждение заказа
│   ├── order-status-update.hbs      # Обновление статуса
│   └── new-order-notification.hbs   # Уведомление админу
├── email.service.ts                  # Сервис с Handlebars рендерингом
├── email.module.ts                   # NestJS модуль
└── README.md                         # Документация
```

Все шаблоны загружаются при инициализации сервиса и компилируются в Map для быстрого доступа.
