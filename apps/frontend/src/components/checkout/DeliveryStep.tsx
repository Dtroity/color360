'use client';

import React, { useMemo } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CheckoutFormData } from '../../schemas/checkout.schema';

interface DeliveryStepProps {
  form: UseFormReturn<CheckoutFormData>;
  deliveryCost?: number | null;
}

const PICKUP_POINTS = [
  { id: 1, address: 'г. Москва, ул. Тверская, д. 10', hours: '10:00 - 20:00' },
  { id: 2, address: 'г. Москва, Ленинградское ш., д. 25', hours: '09:00 - 21:00' },
  { id: 3, address: 'г. Санкт-Петербург, Невский проспект, д. 50', hours: '10:00 - 19:00' },
];

export const DeliveryStep: React.FC<DeliveryStepProps> = ({ form, deliveryCost }) => {
  const { register, watch, setValue, formState: { errors } } = form;
  const method = watch('deliveryMethod');

  const minDate = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }, []);

  return (
    <div className="delivery-step" style={{ display: 'flex', gap: 24 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Способ доставки</h3>

        {/* Radio: Courier */}
        <label style={{ display: 'flex', gap: 10, cursor: 'pointer', padding: 12, border: method === 'courier' ? '2px solid #1677ff' : '1px solid #d9d9d9', borderRadius: 8, background: method === 'courier' ? '#f0f7ff' : '#fff' }}>
          <input type="radio" value="courier" {...register('deliveryMethod')} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Курьерская доставка</div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>Доставка по указанному адресу</div>
          </div>
        </label>

        {method === 'courier' && (
          <div style={{ paddingLeft: 30, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="Город" error={errors.city?.message}>
              <input type="text" placeholder="Москва" {...register('city')} className="delivery-input" />
            </Field>
            <Field label="Адрес доставки" error={errors.address?.message}>
              <input type="text" placeholder="Улица, дом, квартира" {...register('address')} className="delivery-input" />
            </Field>
          </div>
        )}

        {/* Radio: Pickup */}
        <label style={{ display: 'flex', gap: 10, cursor: 'pointer', padding: 12, border: method === 'pickup' ? '2px solid #1677ff' : '1px solid #d9d9d9', borderRadius: 8, background: method === 'pickup' ? '#f0f7ff' : '#fff' }}>
          <input type="radio" value="pickup" {...register('deliveryMethod')} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Самовывоз</div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>Забрать заказ из пункта выдачи</div>
          </div>
        </label>

        {method === 'pickup' && (
          <div style={{ paddingLeft: 30, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PICKUP_POINTS.map((pt) => (
              <label key={pt.id} style={{ display: 'flex', gap: 8, padding: 10, border: '1px solid #f0f0f0', borderRadius: 6, cursor: 'pointer' }}>
                <input type="radio" name="pickupPoint" value={pt.id} onChange={() => setValue('city', pt.address)} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{pt.address}</div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>Часы работы: {pt.hours}</div>
                </div>
              </label>
            ))}
          </div>
        )}

        {/* Radio: Transport */}
        <label style={{ display: 'flex', gap: 10, cursor: 'pointer', padding: 12, border: method === 'transport' ? '2px solid #1677ff' : '1px solid #d9d9d9', borderRadius: 8, background: method === 'transport' ? '#f0f7ff' : '#fff' }}>
          <input type="radio" value="transport" {...register('deliveryMethod')} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Транспортная компания</div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>Доставка до терминала ТК</div>
          </div>
        </label>

        {method === 'transport' && (
          <div style={{ paddingLeft: 30 }}>
            <Field label="Город" error={errors.city?.message}>
              <input type="text" placeholder="Укажите город доставки" {...register('city')} className="delivery-input" />
            </Field>
          </div>
        )}

        <Field label="Желаемая дата доставки">
          <input type="date" min={minDate} {...register('deliveryDate')} className="delivery-input" />
        </Field>

        <Field label="Комментарий к доставке">
          <textarea placeholder="Дополнительные пожелания" rows={3} {...register('comment')} className="delivery-input" style={{ resize: 'vertical' }} />
        </Field>
      </div>

      {/* Стоимость */}
      {deliveryCost !== undefined && (
        <aside style={{ width: 240, border: '1px solid #f0f0f0', borderRadius: 8, padding: 16, alignSelf: 'flex-start', background: '#fafafa' }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Стоимость доставки</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>
            {deliveryCost === null || deliveryCost === 0
              ? 'Бесплатно'
              : `${deliveryCost.toLocaleString('ru-RU')} ₽`}
          </div>
        </aside>
      )}

      <style jsx>{`
        .delivery-step .delivery-input {
          width: 100%;
          border: 1px solid #d9d9d9;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 14px;
          outline: none;
        }
        .delivery-step .delivery-input:focus { border-color: #1677ff; }
      `}</style>
    </div>
  );
};

interface FieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, error, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>{label}</label>
    {children}
    {error && <div style={{ color: '#cf1322', fontSize: 12, marginTop: 4 }}>{error}</div>}
  </div>
);

export default DeliveryStep;
