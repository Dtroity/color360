import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { catalogApi, GetProductsResponse, ProductFilterParams, ProductSort } from '@/shared/api/catalog';

// Optional toast: if react-hot-toast exists in project
const toast = { error: (msg: string) => {
  try {
    // Dynamically use window toast if available
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyWindow = window as any;
    if (anyWindow?.toast?.error) anyWindow.toast.error(msg);
    else console.error(msg);
  } catch {
    console.error(msg);
  }
}};

const parseNumberArray = (value: string | null): number[] => {
  if (!value) return [];
  return value
    .split(',')
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n));
};

const parseNumber = (value: string | null): number | undefined => {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

export const useCatalog = () => {
  const searchParams = useSearchParams();

  const params: ProductFilterParams = useMemo(() => {
    const spGet = (k: string) => searchParams.get(k);
    return {
      manufacturers: parseNumberArray(spGet('manufacturers')),
      categories: parseNumberArray(spGet('categories')),
      priceFrom: parseNumber(spGet('priceFrom')),
      priceTo: parseNumber(spGet('priceTo')),
      inStock: (() => {
        const v = spGet('inStock');
        if (!v) return undefined;
        const s = v.toLowerCase();
        return s === '1' || s === 'true' || s === 'yes';
      })(),
      search: spGet('search') ?? undefined,
      sort: (spGet('sort') as ProductSort | null) ?? undefined,
      page: parseNumber(spGet('page')) ?? 1,
      limit: parseNumber(spGet('limit')), // Не передаем limit по умолчанию - API вернет все товары
    };
  }, [searchParams]);

  const query = useQuery<GetProductsResponse, Error, GetProductsResponse>({
    queryKey: ['products', params],
    queryFn: () => catalogApi.getProducts(params),
    staleTime: 30_000,
    retry: 1,
  });

  const data = query.data as GetProductsResponse | undefined;
  const products = data?.data ?? [];
  const currentPage = data?.page ?? params.page ?? 1;
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.limit ?? params.limit ?? 20)));

  if (query.error) {
    toast?.error(`Не удалось загрузить каталог: ${query.error.message}`);
  }

  return {
    products,
    isLoading: query.isLoading || query.isFetching,
    error: query.error ?? null,
    totalPages,
    currentPage,
    params,
    query,
  } as const;
};
