'use client';

import { useMemo, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';

type PricingFormValues = {
  price: number | string;
  oldPrice?: number | string;
  stock: number | string;
  availability?: 'in_stock' | 'preorder' | 'out_of_stock' | string;
};

interface PricingStepProps {
  form: UseFormReturn<any>;
}

export default function PricingStep({ form }: PricingStepProps) {
  const {
    register,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = form;

  const price = Number(watch('price') ?? 0);
  const oldPrice = Number(watch('oldPrice') ?? 0);
  const [discountInput, setDiscountInput] = useState<string>('');

  const discountPercent = useMemo(() => {
    if (!oldPrice || !price || oldPrice <= price) return 0;
    return Math.round(((oldPrice - price) / oldPrice) * 100);
  }, [price, oldPrice]);

  // Значение для поля "Скидка %": если пользователь не вводил, показываем вычисленное
  const discountFieldValue = discountInput !== ''
    ? discountInput
    : (discountPercent > 0 ? String(discountPercent) : '');

  // Расчет старой цены по скидке
  const onDiscountChange = (v: string) => {
    setDiscountInput(v);
    const num = Number(v.replace(',', '.'));
    if (!isFinite(num) || num <= 0 || num >= 100) return;
    if (price > 0) {
      const computedOld = price / (1 - num / 100);
      const rounded = Math.round(computedOld * 100) / 100;
      setValue('oldPrice', rounded, { shouldValidate: true, shouldDirty: true });
      trigger('oldPrice');
    }
  };

  // Валидация: oldPrice >= price при наличии скидки
  const oldPriceValidation = {
    valueAsNumber: true as const,
    // react-hook-form validate expects string|number|undefined
    validate: (value: string | number | undefined) => {
      const v = Number(value);
      if (!value || Number.isNaN(v) || v === 0) return true;
      if (price && v < price) return 'Старая цена не может быть меньше текущей';
      return true;
    },
  };

  return (
    <div className="space-y-6">
      {/* Цена */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Цена <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.01"
            min={0}
            {...register('price', {
              required: 'Укажите цену',
              valueAsNumber: true,
              min: { value: 0, message: 'Минимум 0' },
            })}
            placeholder="0.00"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.price ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
          />
          <span className="text-sm text-gray-600">₽</span>
        </div>
        {errors.price && (
          <p className="mt-1 text-sm text-red-600">{String(errors.price.message)}</p>
        )}
      </div>

      {/* Старая цена + Скидка % */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Старая цена
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              min={0}
              {...register('oldPrice', oldPriceValidation)}
              placeholder="0.00"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.oldPrice ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
            />
            <span className="text-sm text-gray-600">₽</span>
          </div>
          {errors.oldPrice && (
            <p className="mt-1 text-sm text-red-600">{String(errors.oldPrice.message)}</p>
          )}
          {discountPercent > 0 && (
            <p className="mt-2 text-xs text-green-700">Скидка {discountPercent}%</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Скидка %
          </label>
          <input
            type="number"
            min={0}
            max={99}
            step="1"
            value={discountFieldValue}
            onChange={(e) => onDiscountChange(e.target.value)}
            placeholder="Например, 15"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
          />
          <p className="mt-1 text-xs text-gray-500">Автозаполнит старую цену по текущей цене</p>
        </div>
      </div>

      {/* Остаток */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Количество на складе <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min={0}
            {...register('stock', {
              required: 'Укажите остаток',
              valueAsNumber: true,
              min: { value: 0, message: 'Минимум 0' },
            })}
            placeholder="0"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.stock ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
          />
          {errors.stock && (
            <p className="mt-1 text-sm text-red-600">{String(errors.stock.message)}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Статус
          </label>
          <select
            {...register('availability')}
            className="w-full px-3 py-2 border rounded-md border-gray-300"
            defaultValue="in_stock"
          >
            <option value="in_stock">В наличии</option>
            <option value="preorder">Под заказ</option>
            <option value="out_of_stock">Нет в наличии</option>
          </select>
        </div>
      </div>

      {/* Подсказки */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-xs text-gray-600">
        <ul className="list-disc pl-5 space-y-1">
          <li>Цена и старая цена поддерживают копейки (2 знака после запятой).</li>
          <li>Скидка % рассчитывает старую цену от текущей цены. Диапазон 1–99%.</li>
          <li>Старая цена должна быть больше текущей для корректного расчета скидки.</li>
        </ul>
      </div>
    </div>
  );
}
