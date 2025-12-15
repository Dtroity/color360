'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BreadcrumbItem {
  label: string;
  href: string;
}

export default function Breadcrumbs() {
  const pathname = usePathname();

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [{ label: 'Главная', href: '/' }];

    let currentPath = '';
    paths.forEach((path) => {
      currentPath += `/${path}`;

      // Декодируем URL для отображения кириллицы
      const label = decodeURIComponent(path)
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());

      breadcrumbs.push({ label, href: currentPath });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length <= 1) return null;

  return (
    <nav className="container mx-auto px-4 py-4" aria-label="Хлебные крошки">
      <ol className="flex items-center space-x-2 text-sm text-gray-600">
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.href} className="flex items-center">
            {index > 0 && <span className="mx-2">/</span>}
            {index === breadcrumbs.length - 1 ? (
              <span className="text-gray-900 font-medium">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="hover:text-blue-600 transition-colors">
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

