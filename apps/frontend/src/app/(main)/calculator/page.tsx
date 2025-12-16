'use client';

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/shared/config/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

type Service = {
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

type CalculationResult = {
  items: Array<{ service: Service; quantity: number; price: number }>;
  total: number;
  currency: string;
};

export default function CalculatorPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<Record<number, number>>({});
  const [calculation, setCalculation] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    calculateTotal();
  }, [selectedServices]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/services`);
      if (res.ok) {
        const data = await res.json();
        setServices(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Ошибка загрузки услуг:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = async () => {
    const selected = Object.entries(selectedServices)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => ({ serviceId: Number(id), quantity: qty }));

    if (selected.length === 0) {
      setCalculation(null);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/services/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ services: selected }),
      });

      if (res.ok) {
        const data = await res.json();
        setCalculation(data);
      }
    } catch (err) {
      console.error('Ошибка расчета:', err);
    }
  };

  const handleQuantityChange = (serviceId: number, quantity: number) => {
    setSelectedServices((prev) => ({
      ...prev,
      [serviceId]: Math.max(0, quantity),
    }));
  };

  // Группируем услуги по типу цены для удобства отображения
  const fixedServices = services.filter(s => s.priceType === 'fixed');
  const perUnitServices = services.filter(s => s.priceType === 'per_unit');

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900">Калькулятор услуг</h1>
        <p className="mt-2 text-neutral-600">
          Рассчитайте стоимость монтажа и настройки видеонаблюдения
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {loading ? (
            <div className="text-center py-12 text-neutral-500">Загрузка услуг...</div>
          ) : (
            <div className="space-y-6">
              {/* Услуги с фиксированной ценой */}
              {fixedServices.length > 0 && (
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Услуги с фиксированной ценой</h2>
                  <div className="space-y-4">
                    {fixedServices.map((service) => (
                      <div key={service.id} className="flex items-start justify-between gap-4 border-b border-neutral-100 pb-4 last:border-0">
                        <div className="flex-1">
                          <h3 className="font-medium text-neutral-900">{service.title}</h3>
                          {service.description && (
                            <p className="mt-1 text-sm text-neutral-600">{service.description}</p>
                          )}
                          <div className="mt-2 text-sm font-semibold text-primary-600">
                            {service.basePrice.toLocaleString('ru-RU')} ₽
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={(selectedServices[service.id] || 0) > 0}
                            onChange={(e) => handleQuantityChange(service.id, e.target.checked ? 1 : 0)}
                            className="w-5 h-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm text-neutral-600">Включить</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Услуги с ценой за единицу */}
              {perUnitServices.length > 0 && (
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Услуги с ценой за единицу</h2>
                  <div className="space-y-4">
                    {perUnitServices.map((service) => (
                      <div key={service.id} className="flex items-start justify-between gap-4 border-b border-neutral-100 pb-4 last:border-0">
                        <div className="flex-1">
                          <h3 className="font-medium text-neutral-900">{service.title}</h3>
                          {service.description && (
                            <p className="mt-1 text-sm text-neutral-600">{service.description}</p>
                          )}
                          <div className="mt-2 text-sm text-neutral-500">
                            <span className="font-semibold text-primary-600">
                              {service.basePrice.toLocaleString('ru-RU')} ₽
                            </span>
                            {service.unitName && (
                              <span className="ml-1">/ {service.unitName}</span>
                            )}
                            {service.minQuantity && service.minQuantity > 1 && (
                              <span className="ml-2 text-xs">(мин. {service.minQuantity})</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(service.id, Math.max((selectedServices[service.id] || 0) - 1, service.minQuantity || 0))}
                            className="w-8 h-8 rounded border border-neutral-300 hover:bg-neutral-50"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min={service.minQuantity || 0}
                            value={selectedServices[service.id] || 0}
                            onChange={(e) => handleQuantityChange(service.id, Math.max(Number(e.target.value), service.minQuantity || 0))}
                            className="w-16 px-2 py-1 text-center border rounded border-neutral-300"
                          />
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(service.id, (selectedServices[service.id] || 0) + 1)}
                            className="w-8 h-8 rounded border border-neutral-300 hover:bg-neutral-50"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-8">
            <h2 className="text-xl font-semibold mb-4">Итого</h2>
            {calculation ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  {calculation.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-neutral-600">
                        {item.service.title}
                        {item.service.priceType === 'per_unit' && item.quantity > 1 && (
                          <span> × {item.quantity} {item.service.unitName || 'шт.'}</span>
                        )}
                      </span>
                      <span className="font-medium">
                        {item.price.toLocaleString('ru-RU')} {item.currency}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-neutral-200 pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Всего:</span>
                    <span className="text-primary-600">
                      {calculation.total.toLocaleString('ru-RU')} {calculation.currency}
                    </span>
                  </div>
                </div>
                <Button className="w-full mt-4">Отправить заявку</Button>
              </div>
            ) : (
              <p className="text-neutral-500 text-sm">Выберите услуги для расчета</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

