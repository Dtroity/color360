'use client';

import { UseFormReturn } from 'react-hook-form';
import { CheckoutFormData } from '@/schemas/checkout.schema';
import useCart from '@/store/useCart';
import Image from 'next/image';
import { resolveImageUrl } from '@/shared/lib/resolveImageUrl';

interface ConfirmStepProps {
  form: UseFormReturn<CheckoutFormData>;
  onEditStep?: (step: number) => void;
  onSubmit?: () => void;
}

const DELIVERY_METHODS = {
  courier: 'Курьерская доставка',
  pickup: 'Самовывоз из пункта выдачи',
  transport: 'Транспортной компанией',
};

const PAYMENT_METHODS = {
  cash: 'Наличными при получении',
  card: 'Картой онлайн',
  transfer: 'Банковским переводом',
};

export function ConfirmStep({ form, onEditStep, onSubmit }: ConfirmStepProps) {
  const { watch, register, formState: { errors } } = form;
  const { items, getTotalPrice } = useCart();

  const formData = watch();
  const totalPrice = getTotalPrice();
  const deliveryCost = formData.deliveryMethod === 'courier' ? 500 : 0;
  const finalTotal = totalPrice + deliveryCost;

  const agreeToTerms = watch('agreeToTerms');

  const formatPhone = (phone: string) => {
    if (!phone) return '';
    // +79991234567 -> +7 (999) 123-45-67
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `+${cleaned[0]} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9)}`;
    }
    return phone;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Проверьте ваш заказ</h2>
        <p className="text-gray-600">
          Убедитесь, что все данные указаны верно перед оформлением заказа
        </p>
      </div>

      {/* Контактная информация */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Контактная информация</h3>
          {onEditStep && (
            <button
              type="button"
              onClick={() => onEditStep(1)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Изменить
            </button>
          )}
        </div>

        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-gray-500">Имя и фамилия</dt>
            <dd className="mt-1 text-sm font-medium text-gray-900">
              {formData.firstName} {formData.lastName}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Email</dt>
            <dd className="mt-1 text-sm font-medium text-gray-900">
              {formData.email}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Телефон</dt>
            <dd className="mt-1 text-sm font-medium text-gray-900">
              {formatPhone(formData.phone)}
            </dd>
          </div>
        </dl>
      </div>

      {/* Доставка */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Доставка</h3>
          {onEditStep && (
            <button
              type="button"
              onClick={() => onEditStep(2)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Изменить
            </button>
          )}
        </div>

        <dl className="space-y-3">
          <div>
            <dt className="text-sm text-gray-500">Способ доставки</dt>
            <dd className="mt-1 text-sm font-medium text-gray-900">
              {DELIVERY_METHODS[formData.deliveryMethod as keyof typeof DELIVERY_METHODS]}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Адрес</dt>
            <dd className="mt-1 text-sm font-medium text-gray-900">
              {formData.deliveryMethod === 'courier' && formData.address
                ? `${formData.city}, ${formData.address}`
                : formData.city}
            </dd>
          </div>
          {formData.deliveryDate && (
            <div>
              <dt className="text-sm text-gray-500">Дата доставки</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900">
                {formatDate(formData.deliveryDate)}
              </dd>
            </div>
          )}
          {formData.comment && (
            <div>
              <dt className="text-sm text-gray-500">Комментарий к заказу</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900">
                {formData.comment}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Оплата */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Способ оплаты</h3>
          {onEditStep && (
            <button
              type="button"
              onClick={() => onEditStep(3)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Изменить
            </button>
          )}
        </div>

        <dl className="space-y-3">
          <div>
            <dt className="text-sm text-gray-500">Метод оплаты</dt>
            <dd className="mt-1 text-sm font-medium text-gray-900">
              {PAYMENT_METHODS[formData.paymentMethod as keyof typeof PAYMENT_METHODS]}
            </dd>
          </div>
          {formData.paymentMethod === 'transfer' && (
            <>
              {formData.companyInn && (
                <div>
                  <dt className="text-sm text-gray-500">ИНН организации</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900">
                    {formData.companyInn}
                  </dd>
                </div>
              )}
              {formData.companyName && (
                <div>
                  <dt className="text-sm text-gray-500">Название организации</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900">
                    {formData.companyName}
                  </dd>
                </div>
              )}
            </>
          )}
        </dl>
      </div>

      {/* Товары в заказе */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Товары в заказе</h3>

        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 py-3 border-b border-gray-100 last:border-0"
            >
              <div className="relative w-16 h-16 shrink-0 bg-gray-100 rounded">
                <Image
                  src={resolveImageUrl(item.product.images?.[0]?.url || undefined)}
                  alt={item.product.name}
                  fill
                  sizes="64px"
                  className="object-cover rounded"
                />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {item.product.name}
                </h4>
                <p className="text-sm text-gray-500 mt-1">
                  {item.quantity} шт. × {item.product.price.toLocaleString('ru-RU')} ₽
                </p>
              </div>

              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-gray-900">
                  {(item.product.price * item.quantity).toLocaleString('ru-RU')} ₽
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Итоговая сумма */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Итого</h3>

        <dl className="space-y-2">
          <div className="flex justify-between text-sm">
            <dt className="text-gray-600">Товары ({items.length} шт.)</dt>
            <dd className="font-medium text-gray-900">
              {totalPrice.toLocaleString('ru-RU')} ₽
            </dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-gray-600">Доставка</dt>
            <dd className="font-medium text-gray-900">
              {deliveryCost === 0 ? 'Бесплатно' : `${deliveryCost.toLocaleString('ru-RU')} ₽`}
            </dd>
          </div>
          <div className="pt-2 border-t border-gray-300 flex justify-between">
            <dt className="text-base font-semibold text-gray-900">К оплате</dt>
            <dd className="text-lg font-bold text-gray-900">
              {finalTotal.toLocaleString('ru-RU')} ₽
            </dd>
          </div>
        </dl>
      </div>

      {/* Согласие с условиями */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            {...register('agreeToTerms')}
            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            Я согласен с{' '}
            <a
              href="/terms"
              target="_blank"
              className="text-blue-600 hover:text-blue-700 underline"
            >
              условиями обработки персональных данных
            </a>{' '}
            и{' '}
            <a
              href="/privacy"
              target="_blank"
              className="text-blue-600 hover:text-blue-700 underline"
            >
              политикой конфиденциальности
            </a>
          </span>
        </label>
        {errors.agreeToTerms && (
          <p className="mt-2 text-sm text-red-600">
            {errors.agreeToTerms.message}
          </p>
        )}
      </div>

      {/* Кнопка оформления */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!agreeToTerms}
          className={`
            flex-1 px-6 py-3 rounded-lg font-semibold text-white transition-all
            ${
              agreeToTerms
                ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                : 'bg-gray-300 cursor-not-allowed'
            }
          `}
        >
          Оформить заказ
        </button>

        {onEditStep && (
          <button
            type="button"
            onClick={() => onEditStep(1)}
            className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Вернуться к редактированию
          </button>
        )}
      </div>

      {/* Информация о безопасности */}
      <div className="flex items-start gap-2 text-sm text-gray-600">
        <svg
          className="w-5 h-5 text-green-600 shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
        <p>
          После оформления заказа вам придет подтверждение на email. Наш
          менеджер свяжется с вами для уточнения деталей.
        </p>
      </div>
    </div>
  );
}
