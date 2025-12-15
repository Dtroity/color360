'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { API_BASE_URL } from '@/shared/config/api';

type Manufacturer = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function AdminManufacturersPage() {
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    website: '',
    isActive: true,
  });

  useEffect(() => {
    fetchManufacturers();
  }, []);

  const fetchManufacturers = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching manufacturers from:', `${API_BASE_URL}/api/manufacturers`);
      const res = await fetch(`${API_BASE_URL}/api/manufacturers`);
      console.log('Manufacturers response status:', res.status);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Manufacturers fetch error:', errorText);
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
      const data = await res.json();
      console.log('Manufacturers data:', data);
      setManufacturers(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки производителей';
      console.error('Manufacturers fetch error:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Update
        const res = await fetch(`${API_BASE_URL}/api/manufacturers/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error('Не удалось обновить производителя');
      } else {
        // Create
        const res = await fetch(`${API_BASE_URL}/api/manufacturers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error('Не удалось создать производителя');
      }
      await fetchManufacturers();
      setEditingId(null);
      setFormData({ name: '', slug: '', description: '', website: '', isActive: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    }
  };

  const handleEdit = (m: Manufacturer) => {
    setEditingId(m.id);
    setFormData({
      name: m.name,
      slug: m.slug,
      description: m.description || '',
      website: m.website || '',
      isActive: m.isActive,
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить производителя?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/manufacturers/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Не удалось удалить производителя');
      await fetchManufacturers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Производители</h1>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ name: '', slug: '', description: '', website: '', isActive: true });
          }}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Добавить производителя
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-red-800">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Форма */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">
            {editingId ? 'Редактировать производителя' : 'Новый производитель'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Название *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Описание</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Сайт</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 text-blue-600"
              />
              <label className="ml-2 text-sm text-gray-700">Активен</label>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                {editingId ? 'Сохранить' : 'Создать'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({ name: '', slug: '', description: '', website: '', isActive: true });
                  }}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Отмена
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Список */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Список производителей</h2>
          {loading ? (
            <div className="text-center text-gray-500">Загрузка...</div>
          ) : manufacturers.length === 0 ? (
            <div className="text-center text-gray-500">Нет производителей</div>
          ) : (
            <div className="space-y-2">
              {manufacturers.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-md border border-gray-200 p-3"
                >
                  <div>
                    <div className="font-medium">{m.name}</div>
                    {m.description && (
                      <div className="text-sm text-gray-500">{m.description}</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(m)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

