"use client";

import React from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/useCart';
import CartItem from '@/components/cart/CartItem';
import CartSummary from '@/components/cart/CartSummary';

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const remove = useCartStore((s) => s.removeFromCart);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const totalQuantity = useCartStore((s) => s.getTotalQuantity());

  const empty = items.length === 0;

  if (empty) {
    return (
      <section style={{ padding: '30px 20px', maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ marginBottom: 24 }}>
          <svg width="140" height="140" viewBox="0 0 140 140" fill="none" aria-hidden>
            <rect x="10" y="30" width="120" height="80" rx="12" stroke="#d9d9d9" strokeWidth="3" />
            <path d="M35 30 L50 10 H90 L105 30" stroke="#d9d9d9" strokeWidth="3" fill="none" />
            <circle cx="55" cy="100" r="8" stroke="#d9d9d9" strokeWidth="3" />
            <circle cx="95" cy="100" r="8" stroke="#d9d9d9" strokeWidth="3" />
          </svg>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 600, marginBottom: 12 }}>Ваша корзина пуста</h1>
        <p style={{ color: '#8c8c8c', fontSize: 14, marginBottom: 24 }}>Добавьте товары из каталога, чтобы оформить заказ.</p>
        <Link
          href="/catalog"
          style={{
            display: 'inline-flex',
            padding: '12px 20px',
            background: '#1677ff',
            color: '#fff',
            fontWeight: 500,
            borderRadius: 8,
            textDecoration: 'none',
            fontSize: 15,
          }}
        >
          Перейти в каталог
        </Link>
      </section>
    );
  }

  return (
    <section style={{ padding: '30px 20px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Link href="/catalog" style={{ color: '#1677ff', fontSize: 13, textDecoration: 'none' }}>← Продолжить покупки</Link>
          <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0 }}>Корзина ({totalQuantity})</h1>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
        <div style={{ flexGrow: 1 }}>
          {items.map((it) => (
            <CartItem
              key={it.id}
              item={it}
              onRemove={remove}
              onUpdateQuantity={updateQuantity}
            />
          ))}
        </div>
        <div style={{ flexBasis: 360, position: 'sticky', top: 24, alignSelf: 'flex-start' }}>
          <CartSummary items={items} />
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 960px) {
          section { padding: 24px 16px; }
          h1 { font-size: 24px; }
          .summary-wrapper { position: static; width: 100%; }
          .items-wrapper { width: 100%; }
        }
      `}</style>
    </section>
  );
}

