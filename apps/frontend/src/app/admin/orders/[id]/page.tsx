'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { API_BASE_URL } from '@/shared/config/api';

type OrderItem = {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
};

type OrderStatus = 'new' | 'processing' | 'delivered' | 'cancelled';

type Order = {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerId?: number;
  items: OrderItem[];
  subtotal: number;
  deliveryMethod: string;
  deliveryAddress?: string;
  deliveryDate?: string;
  deliveryCost?: number;
  paymentMethod: string;
  paymentStatus?: 'pending' | 'paid' | 'failed';
  status: OrderStatus;
  statusHistory?: Array<{ status: OrderStatus; changedAt: string; changedBy?: string }>;
  internalNotes?: string;
};

export default function AdminOrderDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<OrderStatus>('new');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      const resp = await fetch(`${API_BASE_URL}/api/orders/${id}`);
      if (!resp.ok) return;
      const data = await resp.json();
      setOrder(data);
      setStatus(data.status);
      setNotes(data.internalNotes || '');
    };
    run();
  }, [id]);

  const customerOrdersLink = useMemo(() => {
    if (!order?.customerId) return null;
    return `/admin/orders?customerId=${order.customerId}`;
  }, [order]);

  const saveStatus = async () => {
    if (!order) return;
    setSaving(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, internalNotes: notes }),
      });
      if (!resp.ok) throw new Error('Не удалось сохранить статус');
      const updated = await resp.json();
      setOrder(updated);
      if (typeof window !== 'undefined' && window.toast) window.toast.success('Статус обновлен');
    } catch {
      if (typeof window !== 'undefined' && window.toast) window.toast.error('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const printOrder = () => {
    if (typeof window !== 'undefined') window.print();
  };

  const notifyCustomer = async () => {
    if (!order) return;
    try {
      const resp = await fetch(`${API_BASE_URL}/api/orders/${order.id}/notify`, { method: 'POST' });
      if (!resp.ok) throw new Error('Не удалось отправить уведомление');
      if (typeof window !== 'undefined' && window.toast) window.toast.success('Уведомление отправлено');
    } catch {
      if (typeof window !== 'undefined' && window.toast) window.toast.error('Ошибка отправки уведомления');
    }
  };

  if (!order) return <div className="p-4">Загрузка...</div>;

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Заказ #{order.orderNumber}</h1>
          <div className="text-sm text-gray-600">ID: {order.id}</div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={printOrder} className="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50">Печать</button>
          <button type="button" onClick={notifyCustomer} className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">Отправить уведомление клиенту</button>
        </div>
      </div>

      {/* Информация о клиенте */}
      <div className="border rounded-md p-4">
        <h2 className="text-lg font-semibold mb-2">Информация о клиенте</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-500">Имя</div>
            <div className="text-sm">{order.customerName}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Email</div>
            <div className="text-sm">{order.customerEmail}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Телефон</div>
            <div className="text-sm">{order.customerPhone}</div>
          </div>
        </div>
        {customerOrdersLink && (
          <div className="mt-2">
            <a href={customerOrdersLink} className="text-sm text-blue-600">История заказов клиента</a>
          </div>
        )}
      </div>

      {/* Товары */}
      <div className="border rounded-md p-4">
        <h2 className="text-lg font-semibold mb-2">Товары</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2 pr-2">Фото</th>
                <th className="py-2 pr-2">Название</th>
                <th className="py-2 pr-2">Цена</th>
                <th className="py-2 pr-2">Количество</th>
                <th className="py-2 pr-2">Сумма</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((it, idx) => (
                <tr key={idx} className="border-t">
                  <td className="py-2 pr-2">
                    {it.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.imageUrl} alt={it.name} className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded" />
                    )}
                  </td>
                  <td className="py-2 pr-2">{it.name}</td>
                  <td className="py-2 pr-2">{it.price.toFixed(2)}</td>
                  <td className="py-2 pr-2">{it.quantity}</td>
                  <td className="py-2 pr-2">{(it.price * it.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-right text-sm mt-2">Итого товаров: {order.subtotal.toFixed(2)}</div>
      </div>

      {/* Доставка */}
      <div className="border rounded-md p-4">
        <h2 className="text-lg font-semibold mb-2">Доставка</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Способ</div>
            <div>{order.deliveryMethod}</div>
          </div>
          <div>
            <div className="text-gray-500">Адрес</div>
            <div>{order.deliveryAddress || '—'}</div>
          </div>
          <div>
            <div className="text-gray-500">Дата</div>
            <div>{order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : '—'}</div>
          </div>
          <div>
            <div className="text-gray-500">Стоимость</div>
            <div>{order.deliveryCost != null ? order.deliveryCost.toFixed(2) : '—'}</div>
          </div>
        </div>
      </div>

      {/* Оплата */}
      <div className="border rounded-md p-4">
        <h2 className="text-lg font-semibold mb-2">Оплата</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Способ</div>
            <div>{order.paymentMethod}</div>
          </div>
          <div>
            <div className="text-gray-500">Статус оплаты</div>
            <div>{order.paymentStatus || '—'}</div>
          </div>
        </div>
      </div>

      {/* Изменение статуса */}
      <div className="border rounded-md p-4">
        <h2 className="text-lg font-semibold mb-2">Статус заказа</h2>
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus)}
            className="px-3 py-2 border rounded-md border-gray-300"
          >
            <option value="new">Новый</option>
            <option value="processing">В обработке</option>
            <option value="delivered">Доставлен</option>
            <option value="cancelled">Отменен</option>
          </select>
          <button
            type="button"
            onClick={saveStatus}
            disabled={saving}
            className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Сохранить
          </button>
        </div>

        {/* Timeline */}
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-gray-700">История изменений</h3>
          <div className="mt-2 space-y-2">
            {(order.statusHistory || []).length === 0 && (
              <div className="text-xs text-gray-500">Нет записей</div>
            )}
            {(order.statusHistory || []).map((h, i) => (
              <div key={i} className="text-xs text-gray-700">
                {new Date(h.changedAt).toLocaleString()} — {h.status} {h.changedBy ? `(${h.changedBy})` : ''}
              </div>
            ))}
          </div>
        </div>

        {/* Internal notes */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Внутренние комментарии</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border rounded-md border-gray-300"
          />
        </div>
      </div>
    </div>
  );
}
