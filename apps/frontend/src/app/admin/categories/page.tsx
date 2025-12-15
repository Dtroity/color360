'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { API_BASE_URL } from '@/shared/config/api';

type Category = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  parent: Category | null;
  children: Category[];
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: '',
    sortOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/categories`);
      if (!res.ok) throw new Error('Не удалось загрузить категории');
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId
        ? `${API_BASE_URL}/api/admin/categories/${editingId}`
        : `${API_BASE_URL}/api/admin/categories`;
      const method = editingId ? 'PUT' : 'POST';

      const payload: any = {
        name: formData.name,
        description: formData.description || null,
        sortOrder: Number(formData.sortOrder),
        isActive: formData.isActive,
      };
      if (formData.parentId) {
        payload.parentId = Number(formData.parentId);
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Не удалось сохранить категорию');
      
      await fetchCategories();
      setEditingId(null);
      setFormData({ name: '', description: '', parentId: '', sortOrder: 0, isActive: true });
    } catch (err) {
      alert('Ошибка: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'));
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      description: category.description || '',
      parentId: category.parent?.id.toString() || '',
      sortOrder: category.sortOrder,
      isActive: category.isActive,
    });
    // Прокрутка к форме редактирования
    setTimeout(() => {
      const formElement = document.querySelector('form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить категорию?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Не удалось удалить');
      await fetchCategories();
    } catch (err) {
      alert('Ошибка удаления: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'));
    }
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (!res.ok) throw new Error('Не удалось изменить статус');
      await fetchCategories();
    } catch (err) {
      alert('Ошибка: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'));
    }
  };

  const renderCategoryTree = (cats: Category[], parentId: number | null = null, level = 0): React.ReactElement[] => {
    return cats
      .filter((cat) => (cat.parent?.id ?? null) === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((cat) => (
        <div key={cat.id} className="ml-4">
          <div
            className={`flex items-center gap-3 p-3 border rounded-lg mb-2 ${
              level === 0 ? 'bg-white' : 'bg-gray-50'
            }`}
            style={{ marginLeft: `${level * 24}px` }}
          >
            <div className="flex-1">
              <div className="font-medium text-gray-900">{cat.name}</div>
              {cat.description && (
                <div className="text-sm text-gray-500 mt-1">{cat.description}</div>
              )}
              <div className="text-xs text-gray-400 mt-1">
                Slug: {cat.slug} | Порядок: {cat.sortOrder}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggleActive(cat.id, cat.isActive)}
                className={`px-3 py-1 rounded text-xs font-medium ${
                  cat.isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {cat.isActive ? 'Активна' : 'Неактивна'}
              </button>
              <button
                onClick={() => handleEdit(cat)}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200"
              >
                Редактировать
              </button>
              <button
                onClick={() => handleDelete(cat.id)}
                className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200"
              >
                Удалить
              </button>
            </div>
          </div>
          {cat.children && cat.children.length > 0 && (
            <div>{renderCategoryTree(cat.children, cat.id, level + 1)}</div>
          )}
        </div>
      ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Загрузка категорий...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Категории</h1>
          <p className="text-gray-600 mt-1">Управление категориями товаров</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {editingId ? 'Редактировать категорию' : 'Создать категорию'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Название *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Родительская категория
              </label>
              <select
                value={formData.parentId}
                onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Нет (корневая категория)</option>
                {categories
                  .filter((c) => !editingId || c.id !== editingId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Порядок сортировки
              </label>
              <input
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Статус
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Активна</span>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Описание
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              {editingId ? 'Сохранить' : 'Создать'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormData({ name: '', description: '', parentId: '', sortOrder: 0, isActive: true });
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium"
              >
                Отмена
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Categories tree */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Список категорий</h2>
        {categories.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Категории не найдены</p>
        ) : (
          <div>{renderCategoryTree(categories)}</div>
        )}
      </div>
    </div>
  );
}

