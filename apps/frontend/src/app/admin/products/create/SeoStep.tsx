'use client';

import { useEffect, useMemo } from 'react';
import { UseFormReturn } from 'react-hook-form';

interface SeoStepProps {
  form: UseFormReturn<any>;
}

function transliterate(input: string): string {
  // Простейшая транслитерация русского в латиницу + очистка
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
    к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
    х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  };
  const lower = input.toLowerCase();
  const out = lower
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9\-\s]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return out;
}

export default function SeoStep({ form }: SeoStepProps) {
  const { setValue, watch } = form;
  const name = watch('name') || '';
  const metaTitle = watch('seo.metaTitle') || '';
  const metaDescription = watch('seo.metaDescription') || '';
  const slug = watch('seo.slug') || '';

  // Автозаполнение metaTitle и slug при наличии названия
  useEffect(() => {
    if (name) {
      const suggestedTitle = name.slice(0, 60);
      const suggestedSlug = transliterate(name).slice(0, 60);
      if (!metaTitle) setValue('seo.metaTitle', suggestedTitle, { shouldDirty: true });
      if (!slug) setValue('seo.slug', suggestedSlug, { shouldDirty: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  const titleCount = metaTitle.length;
  const descCount = metaDescription.length;
  const slugCount = slug.length;

  const previewUrl = useMemo(() => {
    return `https://www.google.com/search?q=${encodeURIComponent(name || metaTitle || '')}`;
  }, [name, metaTitle]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">SEO</h3>
        <p className="text-sm text-gray-600">Заполните метаданные для лучшего отображения в поиске</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
          <input
            type="text"
            value={metaTitle}
            onChange={(e) => setValue('seo.metaTitle', e.target.value.slice(0, 60), { shouldDirty: true })}
            placeholder="До 60 символов"
            className="w-full px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="text-xs text-gray-500 mt-1">Символов: {titleCount} / 60</div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL (slug)</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setValue('seo.slug', transliterate(e.target.value).slice(0, 60), { shouldDirty: true })}
            placeholder="Автогенерация из названия"
            className="w-full px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="text-xs text-gray-500 mt-1">Символов: {slugCount} / 60</div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
        <textarea
          value={metaDescription}
          onChange={(e) => setValue('seo.metaDescription', e.target.value.slice(0, 160), { shouldDirty: true })}
          placeholder="До 160 символов"
          rows={4}
          className="w-full px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="text-xs text-gray-500 mt-1">Символов: {descCount} / 160</div>
      </div>

      {/* Google Preview */}
      <div className="border rounded-md p-4 bg-gray-50">
        <div className="text-sm text-gray-500">Превью сниппета Google</div>
        <div className="mt-2">
          <div className="text-[#1a0dab] text-lg leading-tight">{metaTitle || name || 'Заголовок страницы'}</div>
          <div className="text-[#006621] text-sm">example.com/{slug || 'url-slug'}</div>
          <div className="text-[#545454] text-sm mt-1">{metaDescription || 'Описание до 160 символов...'}</div>
        </div>
        <div className="mt-2">
          <a href={previewUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600">Открыть похожий поиск</a>
        </div>
      </div>
    </div>
  );
}
