import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Доставка и оплата — HiWatch',
  description: 'Условия доставки и варианты оплаты заказов.',
};

export default function DeliveryPage() {
  return (
    <section className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Доставка и оплата</h1>
      
      <div className="prose prose-neutral max-w-none">
        <h2 className="text-2xl font-semibold mt-8 mb-4">Доставка</h2>
        <p className="text-neutral-600 mb-4">
          Мы осуществляем доставку по всей России через ведущие транспортные компании:
        </p>
        <ul className="list-disc list-inside space-y-2 text-neutral-600 mb-6">
          <li>СДЭК</li>
          <li>Почта России</li>
          <li>DPD</li>
          <li>Деловые Линии</li>
        </ul>
        <p className="text-neutral-600 mb-4">
          Стоимость доставки рассчитывается индивидуально в зависимости от региона и веса товара.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Оплата</h2>
        <p className="text-neutral-600 mb-4">
          Доступные способы оплаты:
        </p>
        <ul className="list-disc list-inside space-y-2 text-neutral-600 mb-6">
          <li>Банковские карты</li>
          <li>Наличными при получении</li>
          <li>Безналичный расчет для юридических лиц</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Гарантия</h2>
        <p className="text-neutral-600 mb-4">
          На все товары предоставляется официальная гарантия производителя.
        </p>
      </div>
    </section>
  );
}
