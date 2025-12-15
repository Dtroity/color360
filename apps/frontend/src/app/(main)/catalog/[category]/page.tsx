"use client";

import React, { use } from 'react';
import Link from 'next/link';
import { catalogApi, Product } from '@/shared/api/catalog';
import ProductCard from '@/components/catalog/ProductCard';
import { useQuery } from '@tanstack/react-query';
import Breadcrumbs from '@/widgets/Breadcrumbs';

interface PageProps {
  params: Promise<{ category: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default function CategoryPage({ params, searchParams }: PageProps) {
  const { category } = use(params);
  const categoryName = decodeURIComponent(category);
  
  // Загружаем товары через API с фильтром по категории
  const { data, isLoading, error } = useQuery({
    queryKey: ['products', 'category', categoryName],
    queryFn: async () => {
      // Сначала получаем все категории, чтобы найти ID по slug/name
      const categoriesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/categories`);
      const categories = await categoriesRes.json();
      const categoryObj = Array.isArray(categories) 
        ? categories.find((c: any) => 
            c.name?.toLowerCase().includes(categoryName.toLowerCase()) ||
            c.slug?.toLowerCase() === categoryName.toLowerCase()
          )
        : null;
      
      if (!categoryObj) {
        return { data: [], total: 0, page: 1, limit: 10000 };
      }
      
      return catalogApi.getProducts({ 
        categories: [categoryObj.id],
        limit: 10000 
      });
    },
    staleTime: 30000,
  });

  const products = data?.data || [];
  const total = data?.total || 0;

  return (
    <>
      <Breadcrumbs />
      <section className="container mx-auto px-4 py-12">
      <nav className="text-sm text-neutral-600 mb-4">
        <Link href="/" className="hover:text-primary-600">Главная</Link>
        {' / '}
        <Link href="/catalog" className="hover:text-primary-600">Каталог</Link>
        {' / '}
        <span className="text-neutral-900">{categoryName}</span>
      </nav>

      <h1 className="text-3xl font-bold mb-2">{categoryName}</h1>
      <p className="text-neutral-600 mb-8">Найдено товаров: {total}</p>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="border border-neutral-200 rounded-lg p-4 animate-pulse bg-neutral-50 h-80" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">Ошибка загрузки товаров</p>
          <Link href="/catalog" className="text-primary-600 hover:text-primary-700 font-medium">
            ← Вернуться в каталог
          </Link>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-neutral-500 mb-4">В данной категории пока нет товаров</p>
          <Link href="/catalog" className="text-primary-600 hover:text-primary-700 font-medium">
            ← Вернуться в каталог
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
    </>
  );
}
