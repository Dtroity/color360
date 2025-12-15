'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/shared/config/api';

type Category = {
  id: number;
  name: string;
  slug: string;
};

export default function Header() {
  const pathname = usePathname();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCatalogHovered, setIsCatalogHovered] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/categories`);
        if (res.ok) {
          const data = await res.json();
          const cats = Array.isArray(data) ? data : data.data ?? [];
          // Фильтруем только активные категории
          const activeCats = cats.filter((cat: Category & { isActive?: boolean }) => cat.isActive !== false);
          setCategories(activeCats);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Логотип - клик на главную */}
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="text-2xl font-bold text-[var(--color-blue-300)]">
              Системы видеонаблюдения
            </div>
          </Link>

          {/* Навигация */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={`hover:text-blue-600 transition-colors ${
                pathname === '/' ? 'text-blue-600 font-medium' : 'text-gray-700'
              }`}
            >
              Главная
            </Link>
            <div
              className="relative"
              onMouseEnter={() => setIsCatalogHovered(true)}
              onMouseLeave={() => setIsCatalogHovered(false)}
            >
              <Link
                href="/catalog"
                className={`hover:text-blue-600 transition-colors ${
                  pathname.startsWith('/catalog') ? 'text-blue-600 font-medium' : 'text-gray-700'
                }`}
              >
                Каталог
              </Link>
              {isCatalogHovered && categories.length > 0 && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-2 z-50">
                  <Link
                    href="/catalog"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                  >
                    Все товары
                  </Link>
                  <div className="border-t border-gray-100 my-1" />
                  {categories.slice(0, 10).map((category) => (
                    <Link
                      key={category.id}
                      href={`/catalog/${category.slug || category.id}`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <Link
              href="/delivery"
              className={`hover:text-blue-600 transition-colors ${
                pathname === '/delivery' ? 'text-blue-600 font-medium' : 'text-gray-700'
              }`}
            >
              Доставка
            </Link>
            <Link
              href="/contact"
              className={`hover:text-blue-600 transition-colors ${
                pathname === '/contact' ? 'text-blue-600 font-medium' : 'text-gray-700'
              }`}
            >
              Контакты
            </Link>
          </nav>

          {/* Мобильное меню */}
          <button className="md:hidden p-2" aria-label="Меню">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

