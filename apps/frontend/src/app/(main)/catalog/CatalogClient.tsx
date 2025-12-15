'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Product, GetProductsResponse, ProductSort } from '@/shared/api/catalog';
import ProductCard from '@/components/catalog/ProductCard';
import ProductCardSkeleton from '@/components/catalog/ProductCardSkeleton';
import SortSelect from '@/components/catalog/SortSelect';
import ViewToggle from '@/components/catalog/ViewToggle';
import Pagination from '@/components/catalog/Pagination';
import Filters from '@/components/catalog/Filters';
import MobileFilters from '@/components/catalog/MobileFilters';
import { useQuery } from '@tanstack/react-query';
import { catalogApi } from '@/shared/api/catalog';

type CatalogClientProps = {
  initialData: GetProductsResponse;
};

export function CatalogClient({ initialData }: CatalogClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Парсинг параметров из URL
  const filters = useMemo(() => {
    const manufacturers = searchParams.get('manufacturers')?.split(',').map(Number).filter(Boolean) || [];
    const categories = searchParams.get('categories')?.split(',').map(Number).filter(Boolean) || [];
    const priceFrom = searchParams.get('priceFrom') ? Number(searchParams.get('priceFrom')) : undefined;
    const priceTo = searchParams.get('priceTo') ? Number(searchParams.get('priceTo')) : undefined;
    const inStock = searchParams.get('inStock') === 'true';
    const search = searchParams.get('search') || undefined;
    const sort = (searchParams.get('sort') as ProductSort) || ProductSort.POPULAR;
    const page = searchParams.get('page') ? Number(searchParams.get('page')) : 1;
    // По умолчанию не передаем limit - API вернет все товары
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;

    return {
      manufacturers: manufacturers.length > 0 ? manufacturers : undefined,
      categories: categories.length > 0 ? categories : undefined,
      priceFrom,
      priceTo,
      inStock: inStock ? true : undefined,
      search,
      sort,
      page,
      limit,
    };
  }, [searchParams]);

  // Загрузка данных через React Query
  const { data, isLoading, error } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => catalogApi.getProducts(filters),
    initialData,
    staleTime: 30000, // 30 секунд
  });

  const products = data?.data || [];
  const total = data?.total || 0;
  const currentPage = data?.page || 1;
  const actualLimit = data?.limit || products.length || 10000;
  const totalPages = actualLimit > 0 ? Math.ceil(total / actualLimit) : 1;
  
  // #region agent log
  useEffect(() => {
    if (products.length > 0) {
      fetch('http://127.0.0.1:7242/ingest/1f928c9a-520e-43c4-b508-db12c4521d27',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CatalogClient.tsx:60',message:'CSR products order',data:{total,first5Ids:products.slice(0,5).map(p=>p.id),first5Categories:products.slice(0,5).map(p=>({id:p.id,category:p.category?.name}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    }
  }, [products, total]);
  // #endregion

  // Обновление URL при изменении фильтров
  const updateFilters = (newFilters: Partial<typeof filters>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        params.delete(key);
      } else if (Array.isArray(value)) {
        params.set(key, value.join(','));
      } else {
        params.set(key, String(value));
      }
    });

    // Сбрасываем страницу при изменении фильтров
    if (newFilters.page === undefined) {
      params.delete('page');
    }

    router.push(`/catalog?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Заголовок и управление */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Каталог товаров</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Найдено товаров: {total}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Мобильные фильтры */}
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 lg:hidden"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Фильтры
            </button>

            {/* Лимит товаров на странице */}
            <select
              value={filters.limit ? String(filters.limit) : 'all'}
              onChange={(e) => {
                const value = e.target.value;
                const limit = value === 'all' ? undefined : Number(value);
                updateFilters({ limit, page: 1 });
              }}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Все товары</option>
              <option value={20}>20 на странице</option>
              <option value={50}>50 на странице</option>
              <option value={100}>100 на странице</option>
              <option value={200}>200 на странице</option>
            </select>

            {/* Сортировка */}
            <SortSelect
              value={filters.sort || ProductSort.POPULAR}
              onChange={(sort) => updateFilters({ sort })}
            />

            {/* Переключение вида */}
            <ViewToggle view={viewMode} onChange={setViewMode} />
          </div>
        </div>

        <div className="flex gap-6">
          {/* Боковая панель фильтров (десктоп) */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-8">
              <Filters
                filters={filters}
                onFiltersChange={updateFilters}
              />
            </div>
          </aside>

          {/* Основной контент */}
          <main className="flex-1">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
                Ошибка загрузки товаров. Попробуйте обновить страницу.
              </div>
            )}

            {isLoading ? (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'space-y-4'}>
                {Array.from({ length: 12 }).map((_, i) => (
                  <ProductCardSkeleton key={i} view={viewMode} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-lg border border-neutral-200 bg-white p-12 text-center">
                <svg className="mx-auto h-12 w-12 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-4 text-lg font-semibold text-neutral-900">Товары не найдены</h3>
                <p className="mt-2 text-sm text-neutral-600">
                  Попробуйте изменить параметры фильтрации
                </p>
                <button
                  onClick={() => router.push('/catalog')}
                  className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                >
                  Сбросить фильтры
                </button>
              </div>
            ) : (
              <>
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'space-y-4'}>
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} view={viewMode} />
                  ))}
                </div>

                {/* Пагинация */}
                {totalPages > 1 && (
                  <div className="mt-8">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={(page) => updateFilters({ page })}
                    />
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Мобильные фильтры */}
      <MobileFilters
        isOpen={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        filters={filters}
        onFiltersChange={updateFilters}
      />
    </div>
  );
}
