import React from 'react';
import { GetProductsResponse, ProductFilterParams } from '@/shared/api/catalog';
import { CatalogClient } from './CatalogClient';
import Breadcrumbs from '@/widgets/Breadcrumbs';

export const metadata = {
  title: 'Каталог — HiWatch | Видеонаблюдение и безопасность',
  description: 'Просматривайте каталог товаров: камеры, регистраторы, аксессуары. Фильтры по производителю, цене и сортировка.',
};

const buildQueryString = (params: Record<string, string | number | boolean | undefined | null>) => {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val === undefined || val === null || val === '') return;
    usp.set(key, String(val));
  });
  return usp.toString();
};

async function getProductsSSR(params: ProductFilterParams): Promise<GetProductsResponse> {
  const qs = buildQueryString(params as Record<string, any>);
  // Используем NEXT_PUBLIC_API_URL для единообразия
  const base = process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  const url = `${base}/api/products${qs ? `?${qs}` : ''}`;
  
  console.log('[SSR] Fetching products from:', url);
  
  const res = await fetch(url, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error('[SSR] Failed to fetch products:', res.status, res.statusText, errorText);
    // #region agent log
    try {
      const fs = require('fs');
      const path = require('path');
      const logPath = path.join(process.cwd(), '.cursor', 'debug.log');
      const logEntry = JSON.stringify({
        location: 'catalog/page.tsx:33',
        message: 'SSR fetch failed',
        data: { status: res.status, statusText: res.statusText, errorText: errorText.substring(0, 200), url },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'E'
      }) + '\n';
      fs.appendFileSync(logPath, logEntry, 'utf8');
    } catch (e) {}
    // #endregion
    throw new Error(`Failed to fetch products: ${res.status}`);
  }
  
  const data = await res.json();
  console.log('[SSR] Products fetched:', { count: data.data?.length, total: data.total, limit: data.limit });
  
  // #region agent log
  try {
    const fs = require('fs');
    const path = require('path');
    const logPath = path.join(process.cwd(), '.cursor', 'debug.log');
    const logEntry = JSON.stringify({
      location: 'catalog/page.tsx:39',
      message: 'SSR products fetched',
      data: {
        total: data.total,
        count: data.data?.length || 0,
        first5Ids: data.data?.slice(0, 5).map((p: any) => p?.id) || [],
        url,
      },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'E'
    }) + '\n';
    fs.appendFileSync(logPath, logEntry, 'utf8');
  } catch (e) {}
  // #endregion
  
  // #region agent log
  if (data.data && data.data.length > 0) {
    const fs = require('fs');
    const path = require('path');
    try {
      const logPath = path.join(process.cwd(), '.cursor', 'debug.log');
      const logEntry = JSON.stringify({
        location: 'catalog/page.tsx:38',
        message: 'SSR products order',
        data: {
          total: data.total,
          first5Ids: data.data.slice(0, 5).map((p: any) => p.id),
          first5Categories: data.data.slice(0, 5).map((p: any) => ({ id: p.id, category: p.category?.name, sortOrder: p.category?.sortOrder })),
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'D'
      }) + '\n';
      fs.appendFileSync(logPath, logEntry, 'utf8');
    } catch (e) {
      // Ignore if fs not available
    }
  }
  // #endregion
  
  return data;
}

interface PageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CatalogPage(props: PageProps) {
  // В Next.js 15+ searchParams — это Promise
  const searchParams = await props.searchParams || {};
  
  const toParams: ProductFilterParams = {
    manufacturers: (typeof searchParams.manufacturers === 'string' 
      ? searchParams.manufacturers 
      : Array.isArray(searchParams.manufacturers) 
        ? searchParams.manufacturers[0] 
        : undefined)
      ?.split(',')
      .map((v) => Number(v))
      .filter((n) => Number.isFinite(n)),
      
    categories: (typeof searchParams.categories === 'string' 
      ? searchParams.categories 
      : Array.isArray(searchParams.categories) 
        ? searchParams.categories[0] 
        : undefined)
      ?.split(',')
      .map((v) => Number(v))
      .filter((n) => Number.isFinite(n)),
      
    priceFrom: searchParams.priceFrom 
      ? Number(Array.isArray(searchParams.priceFrom) ? searchParams.priceFrom[0] : searchParams.priceFrom) 
      : undefined,
      
    priceTo: searchParams.priceTo 
      ? Number(Array.isArray(searchParams.priceTo) ? searchParams.priceTo[0] : searchParams.priceTo) 
      : undefined,
      
    inStock: searchParams.inStock 
      ? ['1', 'true', 'yes'].includes(
          String(Array.isArray(searchParams.inStock) ? searchParams.inStock[0] : searchParams.inStock).toLowerCase()
        ) 
      : undefined,
      
    search: Array.isArray(searchParams.search) 
      ? searchParams.search[0] 
      : searchParams.search,
      
    sort: Array.isArray(searchParams.sort) 
      ? (searchParams.sort[0] as any) 
      : (searchParams.sort as any),
      
    page: searchParams.page 
      ? Number(Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page) 
      : undefined,
      
    limit: searchParams.limit 
      ? Number(Array.isArray(searchParams.limit) ? searchParams.limit[0] : searchParams.limit) 
      : undefined,
  };
  
  let productsData: GetProductsResponse | null = null;
  
  try {
    // По умолчанию запрашиваем все товары (не передаем limit)
    const paramsWithoutLimit = { ...toParams };
    if (!paramsWithoutLimit.limit) {
      delete paramsWithoutLimit.limit;
    }
    productsData = await getProductsSSR(paramsWithoutLimit);
  } catch (e) {
    console.error('[SSR] Error fetching products:', e);
    productsData = { 
      data: [], 
      total: 0, 
      page: toParams.page ?? 1, 
      limit: toParams.limit ?? 10000 
    };
  }
  
  return (
    <>
      <Breadcrumbs />
      <CatalogClient initialData={productsData} />
    </>
  );
}