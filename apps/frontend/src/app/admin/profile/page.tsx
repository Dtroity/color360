'use client';

import { useState } from 'react';
import { API_BASE_URL } from '@/shared/config/api';

export default function AdminProfilePage() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Валидация на клиенте
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('Все поля обязательны для заполнения');
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Новый пароль и подтверждение не совпадают');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('Новый пароль должен содержать минимум 8 символов');
      setLoading(false);
      return;
    }

    try {
      // Получить токен из cookies
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(c => c.trim().startsWith('access_token='));
      const token = tokenCookie ? tokenCookie.split('=')[1] : null;

      if (!token) {
        setError('Требуется авторизация. Пожалуйста, войдите в систему.');
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/admin/profile/change-password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Не удалось изменить пароль');
      }

      setSuccess('Пароль успешно изменен');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при смене пароля');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Профиль администратора</h1>
        <p className="text-gray-600 mt-1">Управление паролем и настройками профиля</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-2xl">
        <h2 className="text-lg font-semibold mb-4">Смена пароля</h2>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Текущий пароль *
            </label>
            <input
              type="password"
              id="currentPassword"
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              required
              className="w-full px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Новый пароль *
            </label>
            <input
              type="password"
              id="newPassword"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              required
              minLength={8}
              className="w-full px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500">Минимум 8 символов</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Подтверждение пароля *
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              minLength={8}
              className="w-full px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Сохранение...' : 'Изменить пароль'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

