'use client';

import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/shared/config/api';

type InstallationService = {
  id: number;
  title: string;
  description: string | null;
  basePrice: number;
  priceType: 'fixed' | 'per_unit';
  unitName: string | null;
  minQuantity: number | null;
  isActive: boolean;
  sortOrder: number;
};

export default function AdminServicesPage() {
  const [services, setServices] = useState<InstallationService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    basePrice: '',
    priceType: 'fixed' as 'fixed' | 'per_unit',
    unitName: '',
    minQuantity: '1',
    isActive: true,
    sortOrder: 0,
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/admin/services`);
      if (!res.ok) throw new Error('Не удалось загрузить услуги');
      const data = await res.json();
      setServices(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        title: formData.title,
        description: formData.description || null,
        basePrice: Number(formData.basePrice),
        priceType: formData.priceType,
        unitName: formData.unitName || null,
        minQuantity: formData.minQuantity ? Number(formData.minQuantity) : 1,
        isActive: formData.isActive,
        sortOrder: Number(formData.sortOrder),
      };

      const url = editingId
        ? `${API_BASE_URL}/api/admin/services/${editingId}`
        : `${API_BASE_URL}/api/admin/services`;
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Не удалось сохранить');
      }

      await fetchServices();
      setEditingId(null);
      setFormData({
        title: '',
        description: '',
        basePrice: '',
        priceType: 'fixed',
        unitName: '',
        minQuantity: '1',
        isActive: true,
        sortOrder: 0,
      });
    } catch (err) {
      alert('Ошибка: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'));
    }
  };

  const handleEdit = (service: InstallationService) => {
    setEditingId(service.id);
    setFormData({
      title: service.title,
      description: service.description || '',
      basePrice: String(service.basePrice),
      priceType: service.priceType,
      unitName: service.unitName || '',
      minQuantity: String(service.minQuantity || 1),
      isActive: service.isActive,
      sortOrder: service.sortOrder,
    });
    setTimeout(() => {
      const formElement = document.querySelector('form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить услугу?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/services/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Не удалось удалить');
      await fetchServices();
    } catch (err) {
      alert('Ошибка: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'));
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      basePrice: '',
      priceType: 'fixed',
      unitName: '',
      minQuantity: '1',
      isActive: true,
      sortOrder: 0,
    });
  };

  // Drag & Drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (dropIndex: number) => {
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newServices = [...services];
    const draggedService = newServices[draggedIndex];
    newServices.splice(draggedIndex, 1);
    newServices.splice(dropIndex, 0, draggedService);

    const reorderedServices = newServices.map((service, index) => ({
      ...service,
      sortOrder: index,
    }));

    setServices(reorderedServices);
    setDraggedIndex(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/services/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: reorderedServices.map((s) => ({ id: s.id, sortOrder: s.sortOrder })),
        }),
      });
      if (!res.ok) {
        throw new Error('Не удалось сохранить порядок');
      }
    } catch (err) {
      alert('Ошибка сохранения порядка: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'));
      await fetchServices();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Услуги монтажа</h1>
          <p className="text-gray-600 mt-1">Управление услугами монтажа и настройки видеонаблюдения</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Форма */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">
          {editingId ? 'Редактировать услугу' : 'Добавить услугу'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Название услуги *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Базовая цена *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Тип цены *
              </label>
              <select
                value={formData.priceType}
                onChange={(e) => setFormData({ ...formData, priceType: e.target.value as 'fixed' | 'per_unit' })}
                required
                className="w-full px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="fixed">Фиксированная</option>
                <option value="per_unit">За единицу</option>
              </select>
            </div>
            {formData.priceType === 'per_unit' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Единица измерения
                  </label>
                  <input
                    type="text"
                    value={formData.unitName}
                    onChange={(e) => setFormData({ ...formData, unitName: e.target.value })}
                    placeholder="камера, метр, шт."
                    className="w-full px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Минимальное количество
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minQuantity}
                    onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Описание
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Порядок сортировки
              </label>
              <input
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">
                Активна
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {editingId ? 'Сохранить' : 'Добавить'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Отмена
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Таблица */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Загрузка...</div>
        ) : services.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Нет услуг</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Название</th>
                <th className="px-4 py-3 text-left">Цена</th>
                <th className="px-4 py-3 text-left">Тип</th>
                <th className="px-4 py-3 text-left">Ед. изм.</th>
                <th className="px-4 py-3 text-left">Порядок</th>
                <th className="px-4 py-3 text-left">Статус</th>
                <th className="px-4 py-3 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {[...services]
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((service, index) => (
                <tr
                  key={service.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(index)}
                  className={`border-t border-gray-100 hover:bg-gray-50 cursor-move ${draggedIndex === index ? 'opacity-50' : ''}`}
                >
                  <td className="px-4 py-3">
                    <span className="mr-2 text-gray-400">⋮⋮</span>
                    {service.id}
                  </td>
                  <td className="px-4 py-3 font-medium">{service.title}</td>
                  <td className="px-4 py-3">
                    {service.basePrice.toLocaleString('ru-RU')} ₽
                    {service.priceType === 'per_unit' && service.unitName && (
                      <span className="text-xs text-gray-500 ml-1">/ {service.unitName}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded text-xs bg-blue-50 text-blue-700">
                      {service.priceType === 'fixed' ? 'Фиксированная' : 'За единицу'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {service.unitName || <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3">{service.sortOrder}</td>
                  <td className="px-4 py-3">
                    {service.isActive ? (
                      <span className="px-2 py-1 rounded-full text-xs bg-green-50 text-green-700 border border-green-200">
                        Активна
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600 border border-gray-200">
                        Неактивна
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(service)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

