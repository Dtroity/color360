'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { CartItem } from '../../store/useCart';

interface CartSummaryProps {
  items: CartItem[];
  currency?: string; // по умолчанию RUB
  onApplyPromo?: (code: string) => void;
}

const CartSummary: React.FC<CartSummaryProps> = ({ items, currency = '₽', onApplyPromo }) => {
  const [promo, setPromo] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  const totalPrice = useMemo(
    () => items.reduce((sum, it) => sum + it.product.price * it.quantity, 0),
    [items],
  );

  const formattedTotal = totalPrice.toLocaleString('ru-RU');

  const applyPromo = () => {
    const code = promo.trim();
    if (!code) {
      setError('Введите промокод');
      return;
    }
    setError('');
    setAppliedPromo(code);
    onApplyPromo?.(code);
  };

  return (
    <aside className="cart-summary" style={{ border: '1px solid #f0f0f0', borderRadius: 12, padding: 20, background: '#fff', position: 'relative' }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, marginBottom: 16 }}>Итог заказа</h2>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
        <span>Товары</span>
        <span>{formattedTotal} {currency}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
        <span>Доставка</span>
        <span style={{ color: '#8c8c8c' }}>Рассчитывается при оформлении</span>
      </div>
      <div style={{ height: 1, background: '#f0f0f0', margin: '12px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
        <span>Итого</span>
        <span>{formattedTotal} {currency}</span>
      </div>

      <div className="cart-summary__promo" style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Промокод</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={promo}
            onChange={(e) => setPromo(e.target.value)}
            placeholder="Введите код"
            style={{ flex: 1, border: '1px solid #d9d9d9', borderRadius: 6, padding: '8px 10px', fontSize: 14 }}
          />
          <button
            type="button"
            onClick={applyPromo}
            style={{ padding: '8px 14px', background: '#1677ff', color: '#fff', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 14 }}
          >
            Применить
          </button>
        </div>
        {error && <div style={{ color: '#cf1322', fontSize: 12, marginTop: 4 }}>{error}</div>}
        {appliedPromo && !error && (
          <div style={{ color: '#389e0d', fontSize: 12, marginTop: 4 }}>Промокод &quot;{appliedPromo}&quot; применён</div>
        )}
      </div>

      <Link
        href="/checkout"
        className="cart-summary__checkout"
        style={{
          display: 'inline-flex',
          justifyContent: 'center',
          width: '100%',
          padding: '12px 16px',
          background: '#52c41a',
          color: '#fff',
          fontWeight: 600,
          fontSize: 15,
          borderRadius: 8,
          textDecoration: 'none',
        }}
      >
        Оформить заказ
      </Link>

      <style jsx>{`
        @media (max-width: 768px) {
          .cart-summary {
            position: sticky;
            bottom: 0;
            left: 0;
            right: 0;
            border-radius: 12px 12px 0 0;
            box-shadow: 0 -4px 12px rgba(0,0,0,0.08);
            z-index: 30;
          }
        }
      `}</style>
    </aside>
  );
};

export default CartSummary;
