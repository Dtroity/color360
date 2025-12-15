'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import BasicInfoStep from './BasicInfoStep';
import PricingStep from './PricingStep';
import SpecificationsStep from './SpecificationsStep';
import ImagesStep from './ImagesStep';
import SeoStep from './SeoStep';
import { API_BASE_URL } from '@/shared/config/api';

// Тип для глобального тоста, если он есть на window
declare global {
  interface Window {
    toast?: {
      success: (msg: string) => void;
      error: (msg: string) => void;
    };
  }
}

const ImageItemSchema = z.object({
  file: z.any().optional(),
  url: z.string().url().optional(),
  isMain: z.boolean().optional(),
});

const SeoSchema = z.object({
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  slug: z.string().min(1).max(60).optional(),
});

const ProductCreateSchema = z.object({
  name: z.string().min(2),
  sku: z.string().min(1),
  manufacturerId: z.union([z.string(), z.number()]).optional(),
  categoryId: z.union([z.string(), z.number()]).optional(),
  shortDescription: z.string().max(300).optional(),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  oldPrice: z.number().nonnegative().optional(),
  stock: z.number().int().nonnegative(),
  availability: z.enum(['in_stock', 'preorder', 'out_of_stock']).optional(),
  attributes: z.record(z.string(), z.string()).optional(),
  images: z.array(ImageItemSchema).max(10).optional(),
  seo: SeoSchema.optional(),
});

type ProductCreateForm = z.infer<typeof ProductCreateSchema>;

const TABS = [
  { key: 'basic', label: 'Основная информация' },
  { key: 'pricing', label: 'Цены и остатки' },
  { key: 'specs', label: 'Характеристики' },
  { key: 'images', label: 'Изображения' },
  { key: 'seo', label: 'SEO' },
] as const;

type TabKey = typeof TABS[number]['key'];

export default function CreateProductPage() {
  const router = useRouter();
  const form = useForm<ProductCreateForm>({
    resolver: zodResolver(ProductCreateSchema),
    defaultValues: {
      availability: 'in_stock',
      images: [],
      seo: {},
      attributes: {},
    },
    mode: 'onChange',
  });

  const [activeTab, setActiveTab] = useState<TabKey>('basic');
  const lastAutoSave = useRef<number>(Date.now());

  // Индикация незаполненных обязательных полей на табах
  const tabErrors = useMemo(() => {
    const errors = form.formState.errors;
    return {
      basic: !!(errors.name || errors.sku || errors.manufacturerId || errors.categoryId || errors.shortDescription),
      pricing: !!(errors.price || errors.oldPrice || errors.stock || errors.availability),
      specs: !!errors.attributes,
      images: !!errors.images,
      seo: !!(errors.seo?.metaTitle || errors.seo?.metaDescription || errors.seo?.slug),
    } as Record<TabKey, boolean>;
  }, [form.formState.errors]);

  // Автосохранение черновика в localStorage каждые 30 сек
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      if (now - lastAutoSave.current >= 30000) {
        try {
          const data = form.getValues();
          localStorage.setItem('product-create-draft', JSON.stringify(data));
          lastAutoSave.current = now;
          // optional debug
          // console.debug('Draft autosaved');
        } catch {}
      }
    }, 5000);
    return () => clearInterval(id);
  }, [form]);

  // загрузка черновика при инициализации
  useEffect(() => {
    try {
      const raw = localStorage.getItem('product-create-draft');
      if (raw) {
        const parsed = JSON.parse(raw);
        form.reset(parsed);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (data: ProductCreateForm, options?: { createAnother?: boolean }) => {
    try {
      const fd = new FormData();
      // DTO поля
      fd.append('name', data.name);
      fd.append('sku', data.sku);
      if (data.manufacturerId != null) fd.append('manufacturerId', String(data.manufacturerId));
      if (data.categoryId != null) fd.append('categoryId', String(data.categoryId));
      if (data.shortDescription) fd.append('shortDescription', data.shortDescription);
      if (data.description) fd.append('description', data.description);
      fd.append('price', String(data.price));
      if (data.oldPrice != null) fd.append('oldPrice', String(data.oldPrice));
      fd.append('stock', String(data.stock));
      if (data.availability) fd.append('availability', data.availability);
      if (data.attributes) fd.append('attributes', JSON.stringify(data.attributes));
      if (data.seo) fd.append('seo', JSON.stringify(data.seo));

      // файлы
      (data.images || []).forEach((img, idx) => {
        if (img.file) fd.append('files', img.file);
        fd.append('imagesMeta', JSON.stringify({ index: idx, isMain: !!img.isMain }));
      });

      const resp = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        body: fd,
      });
      if (!resp.ok) throw new Error('Не удалось создать товар');

      await resp.json();

      if (options?.createAnother) {
        form.reset();
        localStorage.removeItem('product-create-draft');
      } else {
        router.push('/admin/products');
      }

      // toast при успехе (если есть глобальный)
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.success('Товар создан');
      }
    } catch {
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.error('Ошибка создания товара');
      }
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Создание товара</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b mb-4">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key)}
            className={`px-3 py-2 text-sm font-medium border-b-2 ${
              activeTab === t.key ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-700'
            }`}
          >
            {t.label}
            {tabErrors[t.key] && <span className="ml-2 text-red-600">•</span>}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {activeTab === 'basic' && <BasicInfoStep form={form} />}
        {activeTab === 'pricing' && <PricingStep form={form} />}
        {activeTab === 'specs' && <SpecificationsStep form={form} />}
        {activeTab === 'images' && <ImagesStep form={form} />}
        {activeTab === 'seo' && <SeoStep form={form} />}
      </div>

      {/* Actions */}
      <div className="mt-6 flex items-center gap-2">
        <button
          type="button"
          onClick={form.handleSubmit((d) => submit(d))}
          className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white"
        >
          Сохранить
        </button>
        <button
          type="button"
          onClick={form.handleSubmit((d) => submit(d, { createAnother: true }))}
          className="px-4 py-2 rounded-md bg-blue-100 hover:bg-blue-200 text-blue-700"
        >
          Сохранить и создать еще
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/products')}
          className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}
