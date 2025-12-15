'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { API_BASE_URL } from '@/shared/config/api';

type Stats = {
  totalProducts: number;
  activeProducts: number;
  outOfStock: number;
  totalCategories: number;
  totalManufacturers: number;
  totalOrders: number;
  recentProducts: Array<{
    id: number;
    name: string;
    price: number;
    stock: number;
    createdAt: string;
  }>;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError('');

        // Параллельные запросы для статистики
        const [productsRes, categoriesRes, manufacturersRes, ordersRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/products?limit=1`).catch(() => null),
          fetch(`${API_BASE_URL}/api/categories`).catch(() => null),
          fetch(`${API_BASE_URL}/api/manufacturers`).catch(() => null),
          fetch(`${API_BASE_URL}/api/orders?limit=1`).catch(() => null),
        ]);

        let totalProducts = 0;
        let activeProducts = 0;
        let outOfStock = 0;
        let recentProducts: Stats['recentProducts'] = [];

        if (productsRes && productsRes.ok) {
          const productsData = await productsRes.json();
          totalProducts = productsData.total || 0;
          
          // Получаем последние товары
          const recentRes = await fetch(`${API_BASE_URL}/api/products?limit=5&sort=new`).catch(() => null);
          if (recentRes && recentRes.ok) {
            const recentData = await recentRes.json();
            recentProducts = recentData.data || [];
          }

          // Подсчитываем активные и отсутствующие товары
          if (productsData.data) {
            activeProducts = productsData.data.filter((p: any) => p.isActive).length;
            outOfStock = productsData.data.filter((p: any) => (p.stock || 0) === 0).length;
          }
        }

        const totalCategories = categoriesRes && categoriesRes.ok
          ? (await categoriesRes.json()).length || 0
          : 0;

        const totalManufacturers = manufacturersRes && manufacturersRes.ok
          ? (await manufacturersRes.json()).length || 0
          : 0;

        const totalOrders = ordersRes && ordersRes.ok
          ? (await ordersRes.json()).total || 0
          : 0;

        setStats({
          totalProducts,
          activeProducts,
          outOfStock,
          totalCategories,
          totalManufacturers,
          totalOrders,
          recentProducts,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки статистики');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Загрузка статистики...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-gray-600">Нет данных для отображения</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Общая статистика и быстрый доступ к разделам
        </p>
      </div>

      {/* Статистические карточки */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Товары */}
        <Link
          href="/admin/products"
          className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Всего товаров</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalProducts}</p>
              <p className="mt-1 text-xs text-gray-500">
                Активных: {stats.activeProducts} • Нет в наличии: {stats.outOfStock}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </Link>

        {/* Категории */}
        <Link
          href="/admin/categories"
          className="bg-white rounded-lg border border-gray-200 p-6 hover:border-green-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Категории</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalCategories}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
          </div>
        </Link>

        {/* Производители */}
        <Link
          href="/admin/manufacturers"
          className="bg-white rounded-lg border border-gray-200 p-6 hover:border-purple-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Производители</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalManufacturers}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </Link>

        {/* Заказы */}
        <Link
          href="/admin/orders"
          className="bg-white rounded-lg border border-gray-200 p-6 hover:border-orange-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Заказы</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
        </Link>

        {/* Быстрые действия */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600 mb-4">Быстрые действия</p>
          <div className="space-y-2">
            <Link
              href="/admin/products/create"
              className="block w-full text-left px-4 py-2 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm font-medium transition-colors"
            >
              + Добавить товар
            </Link>
            <Link
              href="/admin/products/import"
              className="block w-full text-left px-4 py-2 rounded-md bg-green-50 text-green-700 hover:bg-green-100 text-sm font-medium transition-colors"
            >
              📥 Импорт из CSV
            </Link>
          </div>
        </div>
      </div>

      {/* Последние добавленные товары */}
      {stats.recentProducts.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Последние добавленные товары</h2>
            <Link
              href="/admin/products"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Все товары →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Цена</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Остаток</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats.recentProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                    <td className="px-4 py-3 text-gray-700">{product.price.toLocaleString('ru-RU')} ₽</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        product.stock > 0
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {product.stock > 0 ? `${product.stock} шт.` : 'Нет в наличии'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(product.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/products/edit/${product.id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Редактировать
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

