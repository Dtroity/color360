'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { API_BASE_URL } from '@/shared/config/api';

type Manufacturer = { id: number; name: string };
type Category = { id: number; name: string };

type ProductRow = {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
  isActive: boolean;
  category?: Category | null;
  manufacturer?: Manufacturer | null;
  image?: string | null;
  primaryImage?: string | null;
  images?: Array<{ url: string; alt?: string }> | null;
};

type ProductsResponse = {
  data: ProductRow[];
  total: number;
  page: number;
  limit: number;
};

const PAGE_SIZE = 20;

export default function AdminProductsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Filters
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [manufacturerId, setManufacturerId] = useState<string>('');
  const [status, setStatus] = useState<string>(''); // '' | 'active' | 'inactive'

  // Sorting
  const [sortKey, setSortKey] = useState<keyof ProductRow | 'price' | 'stock' | 'name' | 'sku'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [page, setPage] = useState(1);

  // Data
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [total, setTotal] = useState(0);

  // Options
  const [categories, setCategories] = useState<Category[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);

  // Selection
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const allSelected = useMemo(() => rows.length > 0 && rows.every((r) => selectedIds.includes(r.id)), [rows, selectedIds]);

  const toggleAll = () => {
    setSelectedIds((prev) => (allSelected ? [] : rows.map((r) => r.id)));
  };

  const toggleOne = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // Fetch filters options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [catsRes, mansRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/categories`).catch(() => null),
          fetch(`${API_BASE_URL}/api/manufacturers`).catch(() => null),
        ]);
        if (catsRes && catsRes.ok) {
          const cats = await catsRes.json();
          setCategories(Array.isArray(cats) ? cats : cats.data ?? []);
        }
        if (mansRes && mansRes.ok) {
          const mans = await mansRes.json();
          setManufacturers(Array.isArray(mans) ? mans : mans.data ?? []);
        }
      } catch (e) {
        // ignore
      }
    };
    fetchOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch products
  useEffect(() => {
    const controller = new AbortController();
    const fetchProducts = async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(PAGE_SIZE));
        if (search) params.set('search', search);
        if (categoryId) params.set('categories', categoryId);
        if (manufacturerId) params.set('manufacturers', manufacturerId);
        if (status) params.set('isActive', status === 'active' ? 'true' : 'false');
        // Маппинг сортировки на формат backend
        if (sortKey === 'price') {
          params.set('sort', sortDir === 'asc' ? 'price_asc' : 'price_desc');
        } else if (sortKey === 'name') {
          params.set('sort', 'new'); // Используем 'new' для сортировки по имени
        } else if (sortKey === 'sku') {
          params.set('sort', 'new'); // Используем 'new' для сортировки по SKU
        } else if (sortKey === 'stock') {
          params.set('sort', 'new'); // Используем 'new' для сортировки по остатку
        }
        // Если sortKey не определен, не передаем sort (backend использует дефолт)

        const url = `${API_BASE_URL}/api/products?${params.toString()}`;
        // #region agent log
        if (typeof window !== 'undefined') {
          fetch('http://127.0.0.1:7242/ingest/1f928c9a-520e-43c4-b508-db12c4521d27',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'admin/products/page.tsx:109',message:'Fetching products for admin',data:{url,page,limit:PAGE_SIZE,search,categoryId,manufacturerId,status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
        }
        // #endregion
        
        const res = await fetch(url, {
          signal: controller.signal,
        });
        
        // #region agent log
        if (typeof window !== 'undefined') {
          fetch('http://127.0.0.1:7242/ingest/1f928c9a-520e-43c4-b508-db12c4521d27',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'admin/products/page.tsx:117',message:'Products API response',data:{ok:res.ok,status:res.status,statusText:res.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
        }
        // #endregion
        
        if (!res.ok) throw new Error('Не удалось загрузить товары');
        const data: ProductsResponse | any = await res.json();

        // #region agent log
        if (typeof window !== 'undefined') {
          fetch('http://127.0.0.1:7242/ingest/1f928c9a-520e-43c4-b508-db12c4521d27',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'admin/products/page.tsx:123',message:'Products data parsed',data:{isArray:Array.isArray(data),hasData:!!data.data,dataLength:Array.isArray(data) ? data.length : data.data?.length,total:data.total},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
        }
        // #endregion

        if (Array.isArray(data)) {
          setRows(data);
          setTotal(data.length);
        } else if (data && Array.isArray(data.data)) {
          setRows(data.data);
          setTotal(Number(data.total ?? data.data.length));
        } else {
          setRows([]);
          setTotal(0);
        }
        setSelectedIds([]);
      } catch (e: any) {
        setError(e.message || 'Ошибка загрузки');
        setRows([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
    return () => controller.abort();
  }, [page, search, categoryId, manufacturerId, status, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const onHeaderSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить товар?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Не удалось удалить товар');
      // reload
      setRows((prev) => prev.filter((r) => r.id !== id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (e: any) {
      alert(e.message || 'Ошибка удаления');
    }
  };

  const handleExportCsv = async () => {
    try {
      const ids = selectedIds.length > 0 ? selectedIds.join(',') : undefined;
      const url = `${API_BASE_URL}/api/admin/products/export/csv${ids ? `?ids=${ids}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Не удалось экспортировать');
      
      const blob = await response.blob();
      const urlBlob = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlBlob;
      a.download = `products-export-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(urlBlob);
    } catch (error) {
      alert('Ошибка экспорта: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Удалить выбранные (${selectedIds.length})?`)) return;
    try {
      // Пытаемся вызвать bulk API, иначе удаляем по одному
      const bulk = await fetch(`${API_BASE_URL}/api/products/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (!bulk.ok) throw new Error('bulk-удаление недоступно, попробуем по одному');
      setRows((prev) => prev.filter((r) => !selectedIds.includes(r.id)));
      setTotal((t) => Math.max(0, t - selectedIds.length));
      setSelectedIds([]);
    } catch {
      // fallback по одному
      for (const id of selectedIds) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/products/${id}`, { method: 'DELETE' });
          if (res.ok) {
            setRows((prev) => prev.filter((r) => r.id !== id));
            setTotal((t) => Math.max(0, t - 1));
          }
        } catch {
          // ignore
        }
      }
      setSelectedIds([]);
    }
  };

  const handleBulkActivate = async () => {
    if (selectedIds.length === 0) return;
    try {
      for (const id of selectedIds) {
        const res = await fetch(`${API_BASE_URL}/api/products/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: true }),
        });
        if (res.ok) {
          setRows((prev) => prev.map((r) => (r.id === id ? { ...r, isActive: true } : r)));
        }
      }
      setSelectedIds([]);
    } catch (error) {
      alert('Ошибка активации: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedIds.length === 0) return;
    try {
      for (const id of selectedIds) {
        const res = await fetch(`${API_BASE_URL}/api/products/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: false }),
        });
        if (res.ok) {
          setRows((prev) => prev.map((r) => (r.id === id ? { ...r, isActive: false } : r)));
        }
      }
      setSelectedIds([]);
    } catch (error) {
      alert('Ошибка деактивации: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
    }
  };

  const handleBulkChangeCategory = async (categoryId: number) => {
    if (selectedIds.length === 0 || !categoryId) return;
    if (!confirm(`Изменить категорию для выбранных (${selectedIds.length}) товаров?`)) return;
    try {
      for (const id of selectedIds) {
        const res = await fetch(`${API_BASE_URL}/api/products/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categoryId }),
        });
        if (res.ok) {
          // Обновляем локальное состояние
          const category = categories.find((c) => c.id === categoryId);
          setRows((prev) => prev.map((r) => (r.id === id ? { ...r, category } : r)));
        }
      }
      setSelectedIds([]);
    } catch (error) {
      alert('Ошибка изменения категории: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Товары</h1>
          <p className="text-gray-600 mt-1">Управление каталогом товаров</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white font-semibold"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Экспорт CSV
          </button>
          <Link
            href="/admin/products/import"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-700 text-white font-semibold"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
            Импорт CSV
          </Link>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
            Добавить товар
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2">
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Поиск по названию или артикулу"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
            />
          </div>
          <div>
            <select
              value={categoryId}
              onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border rounded-md border-gray-300"
            >
              <option value="">Все категории</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={manufacturerId}
              onChange={(e) => { setManufacturerId(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border rounded-md border-gray-300"
            >
              <option value="">Все бренды</option>
              {manufacturers.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border rounded-md border-gray-300"
            >
              <option value="">Все статусы</option>
              <option value="active">Активные</option>
              <option value="inactive">Скрытые</option>
            </select>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={selectedIds.length === 0}
            className={`px-3 py-2 rounded-md text-sm font-semibold border ${selectedIds.length === 0 ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'}`}
          >
            Удалить выбранные ({selectedIds.length})
          </button>
          <button
            type="button"
            onClick={handleBulkActivate}
            disabled={selectedIds.length === 0}
            className={`px-3 py-2 rounded-md text-sm font-semibold border ${selectedIds.length === 0 ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'}`}
          >
            Активировать ({selectedIds.length})
          </button>
          <button
            type="button"
            onClick={handleBulkDeactivate}
            disabled={selectedIds.length === 0}
            className={`px-3 py-2 rounded-md text-sm font-semibold border ${selectedIds.length === 0 ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'}`}
          >
            Деактивировать ({selectedIds.length})
          </button>
          <select
            onChange={(e) => {
              if (e.target.value && selectedIds.length > 0) {
                handleBulkChangeCategory(Number(e.target.value));
                e.target.value = '';
              }
            }}
            disabled={selectedIds.length === 0}
            className={`px-3 py-2 rounded-md text-sm font-semibold border ${selectedIds.length === 0 ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'}`}
          >
            <option value="">Изменить категорию...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="text-sm text-gray-600">Всего: {total}</div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="px-3 py-2 w-12">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              </th>
              <Th label="Фото" />
              <Th label="Название" sortable active={sortKey==='name'} dir={sortDir} onClick={() => onHeaderSort('name')} />
              <Th label="Артикул" sortable active={sortKey==='sku'} dir={sortDir} onClick={() => onHeaderSort('sku')} />
              <Th label="Категория" />
              <Th label="Бренд" />
              <Th label="Цена" sortable active={sortKey==='price'} dir={sortDir} onClick={() => onHeaderSort('price')} right />
              <Th label="Остаток" sortable active={sortKey==='stock'} dir={sortDir} onClick={() => onHeaderSort('stock')} right />
              <Th label="Статус" />
              <Th label="Действия" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-500">Загрузка...</td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-500">Нет данных</td>
              </tr>
            )}
            {!loading && rows.map((row) => (
              <tr key={row.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2">
                  <input type="checkbox" checked={selectedIds.includes(row.id)} onChange={() => toggleOne(row.id)} />
                </td>
                <td className="px-3 py-2">
                  {row.image || row.primaryImage ? (
                    <img
                      src={`${API_BASE_URL}${row.image || row.primaryImage}`}
                      alt={row.name}
                      className="w-12 h-12 rounded object-cover shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-product.svg';
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded bg-gray-100 shrink-0 flex items-center justify-center text-xs text-gray-400">
                      Нет фото
                    </div>
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="font-medium text-gray-900">{row.name}</div>
                  <div className="text-gray-500">ID: {row.id}</div>
                </td>
                <td className="px-3 py-2 text-gray-700">{row.sku}</td>
                <td className="px-3 py-2 text-gray-700">{row.category?.name || '-'}</td>
                <td className="px-3 py-2 text-gray-700">{row.manufacturer?.name || '-'}</td>
                <td className="px-3 py-2 text-right tabular-nums">{row.price?.toLocaleString('ru-RU')} ₽</td>
                <td className="px-3 py-2 text-right tabular-nums">{row.stock}</td>
                <td className="px-3 py-2">
                  {row.isActive ? (
                    <span className="px-2 py-1 rounded-full text-xs bg-green-50 text-green-700 border border-green-200">Активен</span>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600 border border-gray-200">Скрыт</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/products/edit/${row.id}`} className="text-blue-600 hover:text-blue-700">Редактировать</Link>
                    <button className="text-red-600 hover:text-red-700" onClick={() => handleDelete(row.id)}>Удалить</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Страница {page} из {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-2 border rounded-md text-sm disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Назад
          </button>
          <button
            className="px-3 py-2 border rounded-md text-sm disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Далее
          </button>
        </div>
      </div>
    </div>
  );
}

function Th({ label, sortable, active, dir, onClick, right }: { label: string; sortable?: boolean; active?: boolean; dir?: 'asc' | 'desc'; onClick?: () => void; right?: boolean }) {
  return (
    <th
      className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide ${right ? 'text-right' : ''}`}
    >
      <button
        type="button"
        className={`inline-flex items-center gap-1 ${sortable ? 'text-gray-700 hover:text-gray-900' : 'text-gray-700 cursor-default'}`}
        onClick={sortable ? onClick : undefined}
      >
        <span>{label}</span>
        {sortable && (
          <svg className={`w-3 h-3 ${active ? 'text-gray-900' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            {dir === 'desc' ? (
              <path strokeLinecap="round" strokeWidth="2" d="M7 7h10M7 12h7M7 17h4" />
            ) : (
              <path strokeLinecap="round" strokeWidth="2" d="M7 17h10M7 12h7M7 7h4" />
            )}
          </svg>
        )}
      </button>
    </th>
  );
}
