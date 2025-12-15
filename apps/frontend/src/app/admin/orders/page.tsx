'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { API_BASE_URL } from '@/shared/config/api';

type OrderItem = {
  id: number;
  productId: number;
  productName: string;
  price: number;
  quantity: number;
};

type Order = {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: string;
  totalAmount: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
};

type OrdersResponse = {
  data: Order[];
  total: number;
  page: number;
  limit: number;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (statusFilter) {
        params.set('status', statusFilter);
      }
      console.log('Fetching orders from:', `${API_BASE_URL}/api/orders?${params.toString()}`);
      const res = await fetch(`${API_BASE_URL}/api/orders?${params.toString()}`);
      console.log('Orders response status:', res.status);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Orders fetch error:', errorText);
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
      const data: OrdersResponse = await res.json();
      console.log('Orders data:', data);
      setOrders(Array.isArray(data.data) ? data.data : []);
      setTotal(data.total || 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки заказов';
      console.error('Orders fetch error:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Не удалось обновить статус');
      await fetchOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка обновления статуса');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Заказы</h1>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Все статусы</option>
            <option value="pending">Ожидает</option>
            <option value="confirmed">Подтверждён</option>
            <option value="processing">В обработке</option>
            <option value="shipped">Отправлен</option>
            <option value="delivered">Доставлен</option>
            <option value="cancelled">Отменён</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-500">Загрузка заказов...</div>
      ) : orders.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">Заказы не найдены</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Номер заказа
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Клиент
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Товары
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Сумма
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Дата
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-medium text-blue-600 hover:text-blue-800"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                      <div className="text-sm text-gray-500">{order.customerEmail}</div>
                      <div className="text-sm text-gray-500">{order.customerPhone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {order.items?.length || 0} товар(ов)
                      </div>
                      {order.items && order.items.length > 0 && (
                        <div className="text-xs text-gray-500">
                          {order.items[0].productName}
                          {order.items.length > 1 && ` и ещё ${order.items.length - 1}`}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {Number(order.totalAmount).toLocaleString('ru-RU')} ₽
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                      >
                        <option value="pending">Ожидает</option>
                        <option value="confirmed">Подтверждён</option>
                        <option value="processing">В обработке</option>
                        <option value="shipped">Отправлен</option>
                        <option value="delivered">Доставлен</option>
                        <option value="cancelled">Отменён</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Пагинация */}
          {total > 20 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Показано {((page - 1) * 20) + 1} - {Math.min(page * 20, total)} из {total}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
                >
                  Назад
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * 20 >= total}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
                >
                  Вперёд
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

