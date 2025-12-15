import { z } from 'zod';

export const checkoutSchema = z.object({
  // Контакты
  firstName: z.string().min(2, 'Минимум 2 символа'),
  lastName: z.string().min(2, 'Минимум 2 символа'),
  email: z.string().email('Неверный email'),
  phone: z.string().regex(/^\+7\d{10}$/, 'Формат: +79991234567'),

  // Доставка
  deliveryMethod: z.enum(['courier', 'pickup', 'transport']),
  city: z.string().min(2, 'Минимум 2 символа'),
  address: z.string().optional(),
  deliveryDate: z.string().optional(),
  comment: z.string().optional(),

  // Оплата
  paymentMethod: z.enum(['cash', 'card', 'transfer']),
  companyInn: z.string().optional(),
  companyName: z.string().optional(),

  // Согласие
  agreeToTerms: z.boolean().refine((v) => v === true, {
    message: 'Необходимо согласие с условиями',
  }),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;
