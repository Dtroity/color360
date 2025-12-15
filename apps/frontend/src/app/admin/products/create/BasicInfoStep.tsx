'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { API_BASE_URL } from '@/shared/config/api';

type Manufacturer = { id: number; name: string };

type Category = {
  id: number;
  name: string;
  parentId?: number | null;
  children?: Category[];
};

interface BasicInfoStepProps {
  form: UseFormReturn<any>;
}

function useManufacturers() {
  const [data, setData] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/manufacturers`);
        if (res.ok) {
          const json = await res.json();
          setData(Array.isArray(json) ? json : json.data ?? []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);
  return { data, loading };
}

function useCategories() {
  const [data, setData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/categories`);
        if (res.ok) {
          const json = await res.json();
          const list: Category[] = Array.isArray(json) ? json : json.data ?? [];
          setData(buildTree(list));
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);
  return { data, loading };
}

function buildTree(list: Category[]): Category[] {
  const byId = new Map<number, Category>();
  list.forEach((c) => byId.set(c.id, { ...c, children: [] }));
  const roots: Category[] = [];
  byId.forEach((cat) => {
    if (cat.parentId && byId.has(cat.parentId)) {
      byId.get(cat.parentId)!.children!.push(cat);
    } else {
      roots.push(cat);
    }
  });
  return roots;
}

function flattenCategories(cats: Category[], depth = 0): Array<{ id: number; label: string }> {
  const res: Array<{ id: number; label: string }> = [];
  for (const c of cats) {
    res.push({ id: c.id, label: `${'\u2014 '.repeat(depth)}${c.name}` });
    if (c.children && c.children.length) res.push(...flattenCategories(c.children, depth + 1));
  }
  return res;
}

function ToolbarButton({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 text-gray-700"
    >
      {children}
    </button>
  );
}

function RichTextEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || '';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const exec = (cmd: string, arg?: string) => {
    document.execCommand(cmd, false, arg);
    if (ref.current) {
      onChange(ref.current.innerHTML);
    }
  };

  const onInput = () => {
    if (ref.current) onChange(ref.current.innerHTML);
  };

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="flex items-center gap-1 p-2 border-b bg-gray-50">
        <ToolbarButton onClick={() => exec('bold')} title="Жирный">
          <b>B</b>
        </ToolbarButton>
        <ToolbarButton onClick={() => exec('italic')} title="Курсив">
          <i>I</i>
        </ToolbarButton>
        <ToolbarButton onClick={() => exec('underline')} title="Подчеркнутый">
          <u>U</u>
        </ToolbarButton>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <ToolbarButton onClick={() => exec('insertUnorderedList')} title="Список">
          ••
        </ToolbarButton>
        <ToolbarButton onClick={() => exec('insertOrderedList')} title="Нумерованный список">
          1.
        </ToolbarButton>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <ToolbarButton onClick={() => exec('formatBlock', 'H3')} title="Заголовок H3">
          H3
        </ToolbarButton>
        <ToolbarButton onClick={() => exec('removeFormat')} title="Очистить форматирование">
          ✕
        </ToolbarButton>
      </div>
      <div
        ref={ref}
        className="min-h-[180px] p-3 focus:outline-none prose prose-sm max-w-none"
        contentEditable
        onInput={onInput}
        suppressContentEditableWarning
      />
    </div>
  );
}

export default function BasicInfoStep({ form }: BasicInfoStepProps) {
  const {
    register,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = form;

  const { data: manufacturers, loading: mLoading } = useManufacturers();
  const { data: categoriesTree, loading: cLoading } = useCategories();
  const categoryOptions = useMemo(() => flattenCategories(categoriesTree), [categoriesTree]);

  const shortDesc = watch('shortDescription') || '';
  const fullDesc = watch('description') || '';

  // SKU uniqueness check on blur
  const [skuCheck, setSkuCheck] = useState<{ checking: boolean; exists: boolean | null }>({ checking: false, exists: null });

  const checkSku = async (sku: string) => {
    if (!sku) return;
    setSkuCheck({ checking: true, exists: null });
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/check-sku?sku=${encodeURIComponent(sku)}`);
      if (res.ok) {
        const json = await res.json();
        const exists = Boolean(json?.exists);
        setSkuCheck({ checking: false, exists });
        if (exists) {
          // установить ошибку в форме
          (form as any).setError?.('sku', { type: 'manual', message: 'Артикул уже используется' });
        }
      } else {
        setSkuCheck({ checking: false, exists: null });
      }
    } catch {
      setSkuCheck({ checking: false, exists: null });
    }
  };

  return (
    <div className="space-y-6">
      {/* Название */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Название <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          {...register('name', { required: 'Введите название товара', minLength: { value: 2, message: 'Минимум 2 символа' } })}
          placeholder="Укажите название товара"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{String(errors.name.message)}</p>}
      </div>

      {/* Артикул */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Артикул <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            {...register('sku', {
              required: 'Укажите артикул',
              minLength: { value: 2, message: 'Минимум 2 символа' },
              validate: async (value) => {
                if (!value) return true;
                // если уже проверили и существует
                if (skuCheck.exists === true) return 'Артикул уже используется';
                return true;
              },
              onBlur: (e) => checkSku(e.target.value),
            })}
            placeholder="Например: DS-PD1-ABC"
            className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.sku ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
          />
          {skuCheck.checking && (
            <span className="text-xs text-gray-500">Проверка...</span>
          )}
          {skuCheck.exists === true && (
            <span className="text-xs text-red-600">Занят</span>
          )}
          {skuCheck.exists === false && (
            <span className="text-xs text-green-600">Свободен</span>
          )}
        </div>
        {errors.sku && <p className="mt-1 text-sm text-red-600">{String(errors.sku.message)}</p>}
      </div>

      {/* Производитель */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Производитель <span className="text-red-500">*</span>
        </label>
        <select
          {...register('manufacturerId', { required: 'Выберите производителя' })}
          className={`w-full px-3 py-2 border rounded-md ${errors.manufacturerId ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
          defaultValue=""
        >
          <option value="" disabled>
            {mLoading ? 'Загрузка...' : 'Выберите производителя'}
          </option>
          {manufacturers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        {errors.manufacturerId && (
          <p className="mt-1 text-sm text-red-600">{String(errors.manufacturerId.message)}</p>
        )}
      </div>

      {/* Категория (Tree select) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Категория <span className="text-red-500">*</span>
        </label>
        <select
          {...register('categoryId', { required: 'Выберите категорию' })}
          className={`w-full px-3 py-2 border rounded-md ${errors.categoryId ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
          defaultValue=""
        >
          <option value="" disabled>
            {cLoading ? 'Загрузка...' : 'Выберите категорию'}
          </option>
          {categoryOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        {errors.categoryId && (
          <p className="mt-1 text-sm text-red-600">{String(errors.categoryId.message)}</p>
        )}
      </div>

      {/* Краткое описание */}
      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Краткое описание
          </label>
          <span className={`text-xs ${shortDesc.length > 200 ? 'text-red-600' : 'text-gray-500'}`}>
            {shortDesc.length}/200
          </span>
        </div>
        <textarea
          rows={3}
          maxLength={200}
          {...register('shortDescription')}
          placeholder="Короткий текст (до 200 символов)"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.shortDescription ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
        />
        {errors.shortDescription && (
          <p className="mt-1 text-sm text-red-600">{String(errors.shortDescription.message)}</p>
        )}
      </div>

      {/* Полное описание (WYSIWYG) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Полное описание
        </label>
        <RichTextEditor
          value={fullDesc}
          onChange={(html) => {
            setValue('description', html, { shouldValidate: true });
            trigger('description');
          }}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{String(errors.description.message)}</p>
        )}
        <input type="hidden" {...register('description')} />
      </div>
    </div>
  );
}
