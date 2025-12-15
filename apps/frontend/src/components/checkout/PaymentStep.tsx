'use client';

import { UseFormReturn } from 'react-hook-form';
import { CheckoutFormData } from '@/schemas/checkout.schema';

interface PaymentStepProps {
  form: UseFormReturn<CheckoutFormData>;
}

const PAYMENT_METHODS = [
  {
    id: 'cash',
    label: 'Наличными при получении',
    description: 'Оплата курьеру или в пункте выдачи наличными',
  },
  {
    id: 'card',
    label: 'Картой онлайн',
    description: 'Безопасная оплата через платежный шлюз',
    logos: [
      { name: 'Visa', url: '/images/payment/visa.svg' },
      { name: 'MasterCard', url: '/images/payment/mastercard.svg' },
    ],
  },
  {
    id: 'transfer',
    label: 'Банковским переводом',
    description: 'Для юридических лиц. Оплата по счету в течение 3 рабочих дней',
  },
] as const;

export function PaymentStep({ form }: PaymentStepProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = form;

  const selectedPaymentMethod = watch('paymentMethod');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Способ оплаты</h2>

        <div className="space-y-3">
          {PAYMENT_METHODS.map((method) => (
            <label
              key={method.id}
              className={`
                relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all
                ${
                  selectedPaymentMethod === method.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  value={method.id}
                  {...register('paymentMethod')}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {method.label}
                    </span>

                    {method.id === 'card' && method.logos && (
                      <div className="flex gap-1.5 ml-2">
                        {method.logos.map((logo) => (
                          <div
                            key={logo.name}
                            className="w-10 h-6 bg-white border border-gray-200 rounded flex items-center justify-center text-xs font-semibold text-gray-600"
                            title={logo.name}
                          >
                            {logo.name === 'Visa' ? 'VISA' : 'MC'}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mt-1">
                    {method.description}
                  </p>
                </div>
              </div>

              {/* Информационные сообщения для каждого способа */}
              {selectedPaymentMethod === method.id && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  {method.id === 'cash' && (
                    <div className="flex gap-2 text-sm text-gray-700">
                      <svg
                        className="w-5 h-5 text-green-600 shrink-0"
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
                        Вы сможете проверить товар перед оплатой. Не забудьте
                        подготовить точную сумму или уточните у курьера
                        наличие сдачи.
                      </span>
                    </div>
                  )}

                  {method.id === 'card' && (
                    <div className="flex gap-2 text-sm text-gray-700">
                      <svg
                        className="w-5 h-5 text-blue-600 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                      <span>
                        Безопасная оплата по защищенному протоколу. Данные
                        вашей карты не передаются нам и надежно защищены.
                        После подтверждения заказа вы будете перенаправлены
                        на страницу оплаты.
                      </span>
                    </div>
                  )}

                  {method.id === 'transfer' && (
                    <div className="flex gap-2 text-sm text-gray-700">
                      <svg
                        className="w-5 h-5 text-purple-600 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      <span>
                        После оформления заказа вам будет выслан счет на
                        электронную почту. Товар будет зарезервирован на 3
                        рабочих дня.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </label>
          ))}
        </div>

        {errors.paymentMethod && (
          <p className="mt-2 text-sm text-red-600">
            {errors.paymentMethod.message}
          </p>
        )}
      </div>

      {/* Дополнительные поля для банковского перевода */}
      {selectedPaymentMethod === 'transfer' && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-4">
          <h3 className="font-medium text-gray-900">
            Реквизиты организации
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="companyInn"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                ИНН организации <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="companyInn"
                {...register('companyInn')}
                placeholder="1234567890"
                maxLength={12}
                className={`
                  w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${
                    errors.companyInn
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }
                `}
              />
              {errors.companyInn && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.companyInn.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="companyName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Название организации <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="companyName"
                {...register('companyName')}
                placeholder='ООО "Название"'
                className={`
                  w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${
                    errors.companyName
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }
                `}
              />
              {errors.companyName && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.companyName.message}
                </p>
              )}
            </div>
          </div>

          <div className="text-sm text-gray-600 flex items-start gap-2">
            <svg
              className="w-4 h-4 text-gray-400 shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              Для оплаты с НДС укажите корректные реквизиты. Счет и
              закрывающие документы будут высланы на указанный email.
            </span>
          </div>
        </div>
      )}

      {/* Безопасность платежей */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
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
          <div>
            <p className="text-sm font-medium text-gray-900">
              Безопасность платежей
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Все платежи проходят по защищенному протоколу SSL. Мы не
              храним данные вашей банковской карты.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
