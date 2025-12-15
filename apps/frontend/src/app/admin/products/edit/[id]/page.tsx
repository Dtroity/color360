'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import BasicInfoStep from '../../create/BasicInfoStep';
import PricingStep from '../../create/PricingStep';
import SpecificationsStep from '../../create/SpecificationsStep';
import ImagesStep from '../../create/ImagesStep';
import SeoStep from '../../create/SeoStep';
import { API_BASE_URL } from '@/shared/config/api';

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

const ProductEditSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
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

type ProductEditForm = z.infer<typeof ProductEditSchema>;

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const form = useForm<ProductEditForm>({
    resolver: zodResolver(ProductEditSchema),
    defaultValues: {
      images: [],
      seo: {},
      attributes: {},
    },
    mode: 'onChange',
  });

  // fetch existing product and fill form
  useEffect(() => {
    const run = async () => {
      if (!id) return;
      // #region agent log
      if (typeof window !== 'undefined') {
        fetch('http://127.0.0.1:7242/ingest/1f928c9a-520e-43c4-b508-db12c4521d27',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'admin/products/edit/[id]/page.tsx:64',message:'Fetching product for edit',data:{id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      }
      // #endregion
      
      try {
        // Используем админский эндпоинт или эндпоинт с id
        let resp = await fetch(`${API_BASE_URL}/api/admin/products/${id}`);
        if (!resp.ok && resp.status === 404) {
          // Fallback на обычный эндпоинт с id
          resp = await fetch(`${API_BASE_URL}/api/products/id/${id}`);
        }
        
        if (!resp.ok) {
          // #region agent log
          if (typeof window !== 'undefined') {
            fetch('http://127.0.0.1:7242/ingest/1f928c9a-520e-43c4-b508-db12c4521d27',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'admin/products/edit/[id]/page.tsx:75',message:'Failed to fetch product',data:{id,status:resp.status,statusText:resp.statusText,url1:`${API_BASE_URL}/api/admin/products/${id}`,url2:`${API_BASE_URL}/api/products/id/${id}`},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
          }
          // #endregion
          throw new Error(`Не удалось загрузить товар: ${resp.status} ${resp.statusText}`);
        }
        
        const data = await resp.json();
        
        // #region agent log
        if (typeof window !== 'undefined') {
          fetch('http://127.0.0.1:7242/ingest/1f928c9a-520e-43c4-b508-db12c4521d27',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'admin/products/edit/[id]/page.tsx:84',message:'Product data received',data:{id:data.id,name:data.name,hasImages:!!data.images,imagesCount:data.images?.length,hasCategory:!!data.category,hasManufacturer:!!data.manufacturer},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        }
        // #endregion
        
        // normalize to form shape
        const images = (data.images || []).map((img: { url?: string; isMain?: boolean }) => ({ url: img.url || '', isMain: !!img.isMain }));
        form.reset({
          id: data.id,
          name: data.name || '',
          sku: data.sku || '',
          manufacturerId: data.manufacturer?.id || data.manufacturerId || null,
          categoryId: data.category?.id || data.categoryId || null,
          shortDescription: data.shortDescription || '',
          description: data.description || '',
          price: data.price || 0,
          oldPrice: data.oldPrice || null,
          stock: data.stock || 0,
          availability: data.availability || 'in_stock',
          attributes: data.attributes || {},
          images,
          seo: data.seo || {},
        });
      } catch (error: any) {
        // #region agent log
        if (typeof window !== 'undefined') {
          fetch('http://127.0.0.1:7242/ingest/1f928c9a-520e-43c4-b508-db12c4521d27',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'admin/products/edit/[id]/page.tsx:103',message:'Error fetching product',data:{id,error:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        }
        // #endregion
        console.error('Error fetching product:', error);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // submit PATCH
  const submit = async (payload: ProductEditForm) => {
    try {
      const fd = new FormData();
      fd.append('name', payload.name);
      fd.append('sku', payload.sku);
      if (payload.manufacturerId != null) fd.append('manufacturerId', String(payload.manufacturerId));
      if (payload.categoryId != null) fd.append('categoryId', String(payload.categoryId));
      if (payload.shortDescription) fd.append('shortDescription', payload.shortDescription);
      if (payload.description) fd.append('description', payload.description);
      fd.append('price', String(payload.price));
      if (payload.oldPrice != null) fd.append('oldPrice', String(payload.oldPrice));
      fd.append('stock', String(payload.stock));
      if (payload.availability) fd.append('availability', payload.availability);
      if (payload.attributes) fd.append('attributes', JSON.stringify(payload.attributes));
      if (payload.seo) fd.append('seo', JSON.stringify(payload.seo));

      // files: new uploads; keep existing via urls
      (payload.images || []).forEach((img, idx) => {
        if (img.file) fd.append('files', img.file);
        fd.append('imagesMeta', JSON.stringify({ index: idx, isMain: !!img.isMain, url: img.url || null }));
      });

      const resp = await fetch(`${API_BASE_URL}/api/products/${id}`, {
        method: 'PATCH',
        body: fd,
      });
      if (!resp.ok) throw new Error('Не удалось сохранить изменения');

      if (typeof window !== 'undefined' && window.toast) window.toast.success('Изменения сохранены');
      router.push('/admin/products');
    } catch {
      if (typeof window !== 'undefined' && window.toast) window.toast.error('Ошибка сохранения');
    }
  };

  const removeProduct = async () => {
    const ok = typeof window !== 'undefined' ? window.confirm('Удалить товар?') : true;
    if (!ok) return;
    try {
      const resp = await fetch(`${API_BASE_URL}/api/products/${id}`, { method: 'DELETE' });
      if (!resp.ok) throw new Error('Не удалось удалить товар');
      if (typeof window !== 'undefined' && window.toast) window.toast.success('Товар удален');
      router.push('/admin/products');
    } catch {
      if (typeof window !== 'undefined' && window.toast) window.toast.error('Ошибка удаления');
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Редактирование товара</h1>

      <div className="space-y-6">
        <BasicInfoStep form={form} />
        <PricingStep form={form} />
        <SpecificationsStep form={form} />
        <ImagesStep form={form} />
        <SeoStep form={form} />
      </div>

      <div className="mt-6 flex items-center gap-2">
        <button
          type="button"
          onClick={form.handleSubmit((d) => submit(d))}
          className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white"
        >
          Сохранить изменения
        </button>
        <button
          type="button"
          onClick={removeProduct}
          className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white"
        >
          Удалить товар
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
