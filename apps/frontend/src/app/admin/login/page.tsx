'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '@/schemas/login.schema';
import { API_BASE_URL } from '@/shared/config/api';

interface WindowWithToast extends Window {
  toast?: {
    success: (message: string) => void;
    error: (message: string) => void;
  };
}

export default function AdminLoginPage() {
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/1f928c9a-520e-43c4-b508-db12c4521d27',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'admin/login/page.tsx:18',message:'AdminLoginPage rendered',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  }
  // #endregion
  
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка авторизации');
      }

      const result = await response.json();

      // Сохранение JWT токена
      if (result.access_token) {
        // Вариант 1: localStorage
        localStorage.setItem('access_token', result.access_token);

        // Вариант 2: cookie (опционально)
        document.cookie = `access_token=${result.access_token}; path=/; max-age=${7 * 24 * 60 * 60}`; // 7 дней
      }

      // Показать успешное уведомление
      if (typeof window !== 'undefined' && (window as WindowWithToast).toast) {
        (window as WindowWithToast).toast!.success('Вход выполнен успешно');
      }

      // Редирект на админ панель (dashboard)
      router.push('/admin/dashboard');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Не удалось войти в систему';
      setError(errorMessage);

      // Показать toast с ошибкой
      if (typeof window !== 'undefined' && (window as WindowWithToast).toast) {
        (window as WindowWithToast).toast!.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Заголовок */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Админ панель</h2>
          <p className="mt-2 text-sm text-gray-600">
            Войдите для доступа к административной панели
          </p>
        </div>

        {/* Форма */}
        <div className="bg-white shadow-xl rounded-lg p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Общая ошибка */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <svg
                    className="w-5 h-5 text-red-600 shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className={`
                  w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors
                  ${
                    errors.email
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300 bg-white'
                  }
                `}
                placeholder="admin@example.com"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Пароль
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
                className={`
                  w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors
                  ${
                    errors.password
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300 bg-white'
                  }
                `}
                placeholder="••••••••"
                disabled={isLoading}
              />
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Запомнить меня */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="remember"
                  className="ml-2 text-sm text-gray-700"
                >
                  Запомнить меня
                </label>
              </div>

              <a
                href="#"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Забыли пароль?
              </a>
            </div>

            {/* Кнопка входа */}
            <button
              type="submit"
              disabled={isLoading}
              className={`
                w-full px-6 py-3 rounded-lg font-semibold text-white transition-all
                ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                }
              `}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Вход...
                </span>
              ) : (
                'Войти'
              )}
            </button>
          </form>

          {/* Разделитель */}
          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">
                Демо данные для входа
              </span>
            </div>
          </div>

          {/* Демо подсказка */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Email:</span> admin@hiwatch.ru
              <br />
              <span className="font-semibold">Пароль:</span> admin123
            </p>
          </div>
        </div>

        {/* Ссылка на главную */}
        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center gap-1"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  );
}
