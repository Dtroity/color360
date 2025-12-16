import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import React from 'react';
import { AdminLayoutWrapper } from './AdminLayoutWrapper';

function decodeJwtDisplayName(token: string | undefined): { name: string; email?: string } {
  if (!token) return { name: 'Администратор' };
  try {
    const payload = token.split('.')[1];
    const json = Buffer.from(payload, 'base64url').toString('utf8');
    const data = JSON.parse(json);
    const name = data.name || data.fullName || data.username || data.email || 'Администратор';
    return { name, email: data.email };
  } catch {
    return { name: 'Администратор' };
  }
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const second = parts[1]?.[0] ?? '';
  return (first + second).toUpperCase() || 'A';
}

const menu = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/products', label: 'Товары' },
  { href: '/admin/categories', label: 'Категории' },
  { href: '/admin/manufacturers', label: 'Производители' },
  { href: '/admin/popular-devices', label: 'Популярные устройства' },
  { href: '/admin/services', label: 'Услуги монтажа' },
  { href: '/admin/orders', label: 'Заказы' },
  { href: '/admin/settings', label: 'Настройки' },
  { href: '/admin/profile', label: 'Профиль' },
];

function AdminLayoutContent({
  children,
  name,
  email,
  initials,
}: {
  children: React.ReactNode;
  name: string;
  email?: string;
  initials: string;
}) {
  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-r border-gray-200 bg-white">
        <div className="h-16 px-4 flex items-center border-b border-gray-200">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded bg-blue-600 text-white font-bold">H</span>
            <span className="text-lg font-semibold text-gray-900">Админ-панель</span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {menu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <Link
            href="/admin/login"
            className="w-full inline-flex items-center justify-center px-4 py-2 rounded-md bg-red-50 text-red-700 hover:bg-red-100 text-sm font-semibold"
          >
            Выход
          </Link>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 px-4 md:px-6 flex items-center justify-between">
          {/* Breadcrumbs (статичные) */}
          <nav className="text-sm text-gray-500" aria-label="Breadcrumb">
            <ol className="inline-flex items-center gap-2">
              <li>
                <Link href="/admin" className="hover:text-gray-700">Админ</Link>
              </li>
            </ol>
          </nav>

          {/* Admin user */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{name}</p>
              {email && <p className="text-xs text-gray-500">{email}</p>}
            </div>
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
              {initials}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  const isAuthenticated = !!token;

  // Если нет токена - редирект на логин (но только если не на странице логина)
  // Проверка пути будет в клиентском компоненте
  if (!token) {
    // Не делаем редирект здесь - пусть клиентский компонент проверит путь
  }

  const { name, email } = decodeJwtDisplayName(token);
  const initials = initialsFromName(name);

  const adminLayoutContent = (
    <AdminLayoutContent name={name} email={email} initials={initials}>
      {children}
    </AdminLayoutContent>
  );

  return (
    <AdminLayoutWrapper
      isAuthenticated={isAuthenticated}
      adminLayout={adminLayoutContent}
    >
      {children}
    </AdminLayoutWrapper>
  );
}
