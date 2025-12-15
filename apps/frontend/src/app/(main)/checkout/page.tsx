'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { checkoutSchema, CheckoutFormData } from '@/schemas/checkout.schema';
import { useCartStore } from '@/store/useCart';
import { CheckoutSteps } from '@/components/checkout/CheckoutSteps';
import { ContactStep } from '@/components/checkout/ContactStep';
import { DeliveryStep } from '@/components/checkout/DeliveryStep';
import { PaymentStep } from '@/components/checkout/PaymentStep';
import { ConfirmStep } from '@/components/checkout/ConfirmStep';

const STEP_TITLES = [
  'Контактная информация',
  'Доставка',
  'Оплата',
  'Подтверждение',
];

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const getTotalPrice = useCartStore((s) => s.getTotalPrice);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '+7',
      deliveryMethod: 'courier',
      city: '',
      address: '',
      deliveryDate: '',
      comment: '',
      paymentMethod: 'cash',
      companyInn: '',
      companyName: '',
      agreeToTerms: false,
    },
    mode: 'onChange',
  });

  // Защита: редирект если корзина пуста
  useEffect(() => {
    if (items.length === 0) {
      router.push('/cart');
    }
  }, [items.length, router]);

  // Если корзина пуста, не рендерим форму
  if (items.length === 0) {
    return null;
  }

  const totalPrice = getTotalPrice();
  const deliveryCost = form.watch('deliveryMethod') === 'courier' ? 500 : 0;
  const finalTotal = totalPrice + deliveryCost;

  // Валидация текущего шага
  const validateCurrentStep = async (): Promise<boolean> => {
    let fieldsToValidate: (keyof CheckoutFormData)[] = [];

    switch (currentStep) {
      case 1:
        fieldsToValidate = ['firstName', 'lastName', 'email', 'phone'];
        break;
      case 2:
        fieldsToValidate = ['deliveryMethod', 'city'];
        if (form.watch('deliveryMethod') === 'courier') {
          fieldsToValidate.push('address');
        }
        break;
      case 3:
        fieldsToValidate = ['paymentMethod'];
        if (form.watch('paymentMethod') === 'transfer') {
          fieldsToValidate.push('companyInn', 'companyName');
        }
        break;
      case 4:
        fieldsToValidate = ['agreeToTerms'];
        break;
    }

    const result = await form.trigger(fieldsToValidate);
    return result;
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleEditStep = (step: number) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitOrder = async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = form.getValues();

      // Подготовка данных заказа
      const orderData = {
        ...formData,
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.product.price,
        })),
        totalPrice,
        deliveryCost,
        finalTotal,
      };

      // Отправка на API
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Ошибка при оформлении заказа');
      }

      const result = await response.json();
      const orderId = result.id || Date.now();

      // Очистить корзину
      clearCart();

      // Редирект на страницу успеха
      router.push(`/order-success/${orderId}`);
    } catch (error) {
      console.error('Ошибка оформления заказа:', error);
      
      // Показать уведомление об ошибке
      if (typeof window !== 'undefined' && (window as any).toast) {
        (window as any).toast.error('Не удалось оформить заказ. Попробуйте снова.');
      } else {
        alert('Не удалось оформить заказ. Попробуйте снова.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <ContactStep form={form} />;
      case 2:
        return <DeliveryStep form={form} />;
      case 3:
        return <PaymentStep form={form} />;
      case 4:
        return (
          <ConfirmStep
            form={form}
            onEditStep={handleEditStep}
            onSubmit={handleSubmitOrder}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Оформление заказа
          </h1>
          <p className="mt-2 text-gray-600">
            Заполните данные для оформления заказа
          </p>
        </div>

        {/* Индикатор шагов */}
        <div className="mb-8">
          <CheckoutSteps currentStep={currentStep} />
        </div>

        {/* Основной контент */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Левая колонка - форма */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              {/* Заголовок текущего шага */}
              <div className="mb-6 pb-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Шаг {currentStep} из {STEP_TITLES.length}:{' '}
                  {STEP_TITLES[currentStep - 1]}
                </h2>
              </div>

              {/* Контент текущего шага */}
              <div className="mb-6">{renderStepContent()}</div>

              {/* Кнопки навигации (не показываем на шаге 4, там свои кнопки) */}
              {currentStep < 4 && (
                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={handleBack}
                      className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      ← Назад
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Далее →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Правая колонка - сводка корзины */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h3 className="text-lg font-semibold mb-4">Ваш заказ</h3>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Товары ({items.length})</span>
                    <span className="font-medium">{totalPrice.toLocaleString('ru-RU')} ₽</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Доставка</span>
                    <span className="font-medium">
                      {deliveryCost === 0 ? 'Бесплатно' : `${deliveryCost.toLocaleString('ru-RU')} ₽`}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Итого</span>
                    <span className="text-xl font-bold text-gray-900">
                      {finalTotal.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                </div>
              </div>

              {/* Информация о безопасности */}
              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex gap-3">
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
                    <p className="text-sm font-medium text-green-900">
                      Безопасная оплата
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      Ваши данные защищены и не передаются третьим лицам
                    </p>
                  </div>
                </div>
              </div>

              {/* Поддержка */}
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <svg
                    className="w-5 h-5 text-blue-600 shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Нужна помощь?
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      Звоните: <a href="tel:+78001234567" className="underline">8 800 123-45-67</a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Индикатор загрузки */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-900 font-medium">Оформление заказа...</p>
          </div>
        </div>
      )}
    </div>
  );
}

