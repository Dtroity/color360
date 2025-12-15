'use client';

import React, { useEffect, useCallback } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CheckoutFormData } from '../../schemas/checkout.schema';

interface ContactStepProps {
  form: UseFormReturn<CheckoutFormData>;
  userProfile?: { firstName?: string; lastName?: string; email?: string; phone?: string } | null;
  isAuthenticated?: boolean;
}

const phoneMask = (value: string) => {
  // Очистить до цифр
  const digits = value.replace(/\D+/g, '');
  // Ожидаемый формат: +7 (XXX) XXX-XX-XX
  // Обеспечиваем +7 в начале
  let trimmed = digits.startsWith('7') ? digits : digits.startsWith('8') ? '7' + digits.slice(1) : digits;
  trimmed = trimmed.replace(/^7?/, '7');
  const part1 = trimmed.slice(1, 4); // XXX
  const part2 = trimmed.slice(4, 7); // XXX
  const part3 = trimmed.slice(7, 9); // XX
  const part4 = trimmed.slice(9, 11); // XX
  let result = '+7';
  if (part1) result += ` (${part1}` + (part1.length === 3 ? ')' : '');
  if (part2) result += part1.length === 3 ? ` ${part2}` : '';
  if (part3) result += part2.length === 3 ? `-${part3}` : '';
  if (part4) result += part3.length === 2 ? `-${part4}` : '';
  return result;
};

export const ContactStep: React.FC<ContactStepProps> = ({ form, userProfile, isAuthenticated }) => {
  const { register, setValue, formState: { errors }, watch } = form;

  // Автозаполнение
  useEffect(() => {
    if (isAuthenticated && userProfile) {
      if (userProfile.firstName) setValue('firstName', userProfile.firstName, { shouldValidate: true });
      if (userProfile.lastName) setValue('lastName', userProfile.lastName, { shouldValidate: true });
      if (userProfile.email) setValue('email', userProfile.email, { shouldValidate: true });
      if (userProfile.phone) setValue('phone', userProfile.phone, { shouldValidate: true });
    }
  }, [isAuthenticated, userProfile, setValue]);

  const phoneRaw = watch('phone');

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = phoneMask(e.target.value);
    setValue('phone', masked, { shouldValidate: true, shouldDirty: true });
  }, [setValue]);

  return (
    <div className="contact-step" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Field
        label="Имя"
        error={errors.firstName?.message}
      >
        <input
          type="text"
          placeholder="Иван"
          {...register('firstName')}
          className="contact-input"
        />
      </Field>
      <Field
        label="Фамилия"
        error={errors.lastName?.message}
      >
        <input
          type="text"
          placeholder="Иванов"
          {...register('lastName')}
          className="contact-input"
        />
      </Field>
      <Field
        label="Email"
        error={errors.email?.message}
      >
        <input
          type="email"
          placeholder="email@example.com"
          {...register('email')}
          className="contact-input"
        />
      </Field>
      <Field
        label="Телефон"
        error={errors.phone?.message}
      >
        <input
          type="tel"
          placeholder="+7 (988) 862-22-71"
          value={phoneRaw || ''}
          onChange={handlePhoneChange}
          className="contact-input"
        />
      </Field>
      <style jsx>{`
        .contact-step .contact-input {
          width: 100%;
          border: 1px solid #d9d9d9;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s ease;
        }
        .contact-step .contact-input:focus { border-color: #1677ff; }
        .field-wrapper label { font-size: 13px; font-weight: 500; margin-bottom: 6px; display: block; }
        .field-error { color: #cf1322; font-size: 12px; margin-top: 4px; }
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
  <div className="field-wrapper" style={{ display: 'flex', flexDirection: 'column' }}>
    <label>{label}</label>
    {children}
    {error && <div className="field-error">{error}</div>}
  </div>
);

export default ContactStep;
