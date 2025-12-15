'use client';

import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/shared/config/api';

type PopularDevice = {
  id: number;
  name: string;
  productId: number | null;
  product: { id: number; name: string } | null;
  image: string | null;
  sortOrder: number;
  isActive: boolean;
};

type Product = {
  id: number;
  name: string;
};

export default function AdminPopularDevicesPage() {
  const [devices, setDevices] = useState<PopularDevice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    productId: '',
    image: '',
    imageFile: null as File | null,
    sortOrder: 0,
    isActive: true,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchDevices();
    fetchProducts();
  }, []);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/admin/popular-devices`);
      if (!res.ok) throw new Error('Не удалось загрузить популярные устройства');
      const data = await res.json();
      setDevices(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products?limit=1000`);
      if (res.ok) {
        const data = await res.json();
        const prods = Array.isArray(data) ? data : data.data ?? [];
        setProducts(prods);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let imageUrl = formData.image;

      // Если есть файл изображения, загружаем его
      if (formData.imageFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', formData.imageFile);
        
        const uploadRes = await fetch(`${API_BASE_URL}/api/files/upload`, {
          method: 'POST',
          body: formDataUpload,
        });

        if (!uploadRes.ok) {
          throw new Error('Не удалось загрузить изображение');
        }

        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url || uploadData.path || formData.image;
      }

      const url = editingId
        ? `${API_BASE_URL}/api/admin/popular-devices/${editingId}`
        : `${API_BASE_URL}/api/admin/popular-devices`;
      const method = editingId ? 'PATCH' : 'POST';

      const payload: any = {
        name: formData.name,
        productId: formData.productId ? Number(formData.productId) : null,
        image: imageUrl || null,
        sortOrder: Number(formData.sortOrder),
        isActive: formData.isActive,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Не удалось сохранить');
      }
      
      await fetchDevices();
      setEditingId(null);
      setFormData({ name: '', productId: '', image: '', imageFile: null, sortOrder: 0, isActive: true });
      setImagePreview(null);
    } catch (err) {
      alert('Ошибка: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'));
    }
  };

  const handleEdit = (device: PopularDevice) => {
    setEditingId(device.id);
    setFormData({
      name: device.name,
      productId: device.productId?.toString() || '',
      image: device.image || '',
      imageFile: null,
      sortOrder: device.sortOrder,
      isActive: device.isActive,
    });
    setImagePreview(device.image || null);
    // Прокрутка к форме редактирования
    setTimeout(() => {
      const formElement = document.querySelector('form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить популярное устройство?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/popular-devices/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Не удалось удалить');
      await fetchDevices();
    } catch (err) {
      alert('Ошибка: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'));
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ name: '', productId: '', image: '', imageFile: null, sortOrder: 0, isActive: true });
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, imageFile: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Популярные устройства</h1>
          <p className="text-gray-600 mt-1">Управление популярными устройствами</p>
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
          {editingId ? 'Редактировать устройство' : 'Добавить устройство'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Название *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Товар
              </label>
              <select
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                className="w-full px-3 py-2 border rounded-md border-gray-300"
              >
                <option value="">Не выбрано</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Изображение
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {imagePreview && (
                <div className="mt-2">
                  <img src={imagePreview} alt="Preview" className="max-w-xs max-h-32 object-contain rounded" />
                </div>
              )}
              {formData.image && !imagePreview && (
                <div className="mt-2">
                  <img src={`${API_BASE_URL}${formData.image}`} alt="Current" className="max-w-xs max-h-32 object-contain rounded" />
                </div>
              )}
              <input
                type="text"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="Или введите URL изображения"
                className="w-full mt-2 px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                Активно
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
        ) : devices.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Нет популярных устройств</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Название</th>
                <th className="px-4 py-3 text-left">Товар</th>
                <th className="px-4 py-3 text-left">Изображение</th>
                <th className="px-4 py-3 text-left">Порядок</th>
                <th className="px-4 py-3 text-left">Статус</th>
                <th className="px-4 py-3 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
                <tr key={device.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">{device.id}</td>
                  <td className="px-4 py-3 font-medium">{device.name}</td>
                  <td className="px-4 py-3">
                    {device.product ? (
                      <span className="text-blue-600">{device.product.name}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {device.image ? (
                      <span className="text-xs text-gray-600 truncate max-w-xs block">{device.image}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{device.sortOrder}</td>
                  <td className="px-4 py-3">
                    {device.isActive ? (
                      <span className="px-2 py-1 rounded-full text-xs bg-green-50 text-green-700 border border-green-200">
                        Активно
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600 border border-gray-200">
                        Неактивно
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(device)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleDelete(device.id)}
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

