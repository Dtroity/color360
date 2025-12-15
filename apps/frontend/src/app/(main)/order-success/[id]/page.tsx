import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { API_BASE_URL } from '@/shared/config/api';

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  deliveryMethod: string;
  city: string;
  address?: string;
  paymentMethod: string;
  subtotal: number;
  deliveryCost: number;
  totalAmount: number;
  createdAt: string;
  items: Array<{
    id: number;
    quantity: number;
    price: number;
    subtotal: number;
    product: {
      id: number;
      name: string;
      image?: string;
    };
  }>;
}

const DELIVERY_METHODS: Record<string, string> = {
  courier: 'Курьерская доставка',
  pickup: 'Самовывоз из пункта выдачи',
  transport: 'Транспортной компанией',
};

const PAYMENT_METHODS: Record<string, string> = {
  cash: 'Наличными при получении',
  card: 'Картой онлайн',
  transfer: 'Банковским переводом',
};

async function getOrder(id: string): Promise<Order | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/orders/${id}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Ошибка загрузки заказа:', error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const order = await getOrder(params.id);

  if (!order) {
    return {
      title: 'Заказ не найден',
    };
  }

  return {
    title: `Заказ ${order.orderNumber} оформлен`,
    description: `Спасибо за заказ! Подтверждение отправлено на ${order.email}`,
  };
}

export default async function OrderSuccessPage({
  params,
}: {
  params: { id: string };
}) {
  const order = await getOrder(params.id);

  if (!order) {
    notFound();
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      {/* Google Analytics purchase event */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if (typeof gtag !== 'undefined') {
              gtag('event', 'purchase', {
                transaction_id: '${order.orderNumber}',
                value: ${order.totalAmount},
                currency: 'RUB',
                items: ${JSON.stringify(
                  order.items.map((item) => ({
                    item_id: item.product.id,
                    item_name: item.product.name,
                    price: item.price,
                    quantity: item.quantity,
                  })),
                )}
              });
            }
          `,
        }}
      />

      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Иконка успеха */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <svg
                className="w-12 h-12 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Спасибо за заказ!
            </h1>
            <p className="text-lg text-gray-600">
              Ваш заказ успешно оформлен
            </p>
          </div>

          {/* Номер заказа */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Номер заказа</p>
              <p className="text-2xl font-bold text-gray-900 mb-4">
                {order.orderNumber}
              </p>
              <p className="text-sm text-gray-600">
                Мы отправили подтверждение на{' '}
                <span className="font-medium text-gray-900">
                  {order.email}
                </span>
              </p>
            </div>
          </div>

          {/* Информация о заказе */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Детали заказа
            </h2>

            <dl className="space-y-4">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-sm text-gray-600">Дата оформления</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {formatDate(order.createdAt)}
                </dd>
              </div>

              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-sm text-gray-600">Получатель</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {order.firstName} {order.lastName}
                </dd>
              </div>

              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-sm text-gray-600">Телефон</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {order.phone}
                </dd>
              </div>

              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-sm text-gray-600">Способ доставки</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {DELIVERY_METHODS[order.deliveryMethod] || order.deliveryMethod}
                </dd>
              </div>

              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-sm text-gray-600">Адрес доставки</dt>
                <dd className="text-sm font-medium text-gray-900 text-right">
                  {order.address ? `${order.city}, ${order.address}` : order.city}
                </dd>
              </div>

              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-sm text-gray-600">Способ оплаты</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {PAYMENT_METHODS[order.paymentMethod] || order.paymentMethod}
                </dd>
              </div>
            </dl>
          </div>

          {/* Товары */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Товары ({order.items.length})
            </h2>

            <div className="space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {item.product.name}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {item.quantity} шт. × {item.price.toLocaleString('ru-RU')} ₽
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {item.subtotal.toLocaleString('ru-RU')} ₽
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Итого */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Товары</span>
                  <span className="font-medium text-gray-900">
                    {order.subtotal.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Доставка</span>
                  <span className="font-medium text-gray-900">
                    {order.deliveryCost === 0
                      ? 'Бесплатно'
                      : `${order.deliveryCost.toLocaleString('ru-RU')} ₽`}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-base font-semibold text-gray-900">
                    Итого
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    {order.totalAmount.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Что дальше? */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              Что дальше?
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 shrink-0 mt-0.5 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>
                  Наш менеджер свяжется с вами в течение 1 часа для
                  подтверждения заказа
                </span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 shrink-0 mt-0.5 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>
                  Вы получите SMS с трек-номером для отслеживания доставки
                </span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 shrink-0 mt-0.5 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>
                  Все детали заказа отправлены на вашу электронную почту
                </span>
              </li>
            </ul>
          </div>

          {/* Кнопки действий */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/"
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-center transition-colors"
            >
              Вернуться на главную
            </Link>
            <Link
              href="/catalog"
              className="flex-1 px-6 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-semibold text-center transition-colors"
            >
              Продолжить покупки
            </Link>
          </div>

          {/* Поддержка */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 mb-2">
              Возникли вопросы по заказу?
            </p>
            <a
              href="tel:+78001234567"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              8 800 123-45-67
            </a>
            <span className="text-gray-400 mx-2">|</span>
            <a
              href="mailto:support@example.com"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              support@example.com
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
