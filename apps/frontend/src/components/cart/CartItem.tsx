'use client';

import React from 'react';
import { CartItem as CartItemType } from '@/store/useCart';
import QuantitySelector from './QuantitySelector';
import Image from 'next/image';
import { resolveImageUrl } from '@/shared/lib/resolveImageUrl';

interface CartItemProps {
  item: CartItemType;
  onRemove: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
}

const CartItem: React.FC<CartItemProps> = ({ item, onRemove, onUpdateQuantity }) => {
  const { product, quantity } = item;
  const image = product.images?.[0];
  const imgSrc = resolveImageUrl(image?.url);
  const imgAlt = image?.alt ?? product.name;

  const priceEach = product.price;
  const sum = priceEach * quantity;

  const remove = () => {
    if (typeof window !== 'undefined') {
      // Подтверждение удаления
      if (window.confirm('Удалить товар из корзины?')) {
        onRemove(item.id);
      }
    } else {
      onRemove(item.id);
    }
  };

  return (
    <div className="cart-item">
      <div className="cart-item__image">
        <div style={{ position: 'relative', width: 80, height: 80, borderRadius: 8, overflow: 'hidden', background: '#f5f5f5' }}>
          <Image src={imgSrc} alt={imgAlt} fill sizes="80px" style={{ objectFit: 'cover' }} />
        </div>
      </div>
      <div className="cart-item__title">
        <div style={{ fontSize: 14, fontWeight: 500, lineHeight: '18px' }}>{product.name}</div>
        <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>Артикул: {product.sku}</div>
      </div>
      <div className="cart-item__price-each" style={{ fontSize: 14, fontWeight: 500 }}>
        {priceEach.toLocaleString('ru-RU')} {product.currency}
      </div>
      <div className="cart-item__quantity">
        <QuantitySelector
          value={quantity}
          max={product.stock ?? 9999}
          onChange={(val) => onUpdateQuantity(item.id, val)}
        />
      </div>
      <div className="cart-item__sum" style={{ fontSize: 15, fontWeight: 600 }}>
        {sum.toLocaleString('ru-RU')} {product.currency}
      </div>
      <div className="cart-item__remove">
        <button
          type="button"
          onClick={remove}
          aria-label="Удалить из корзины"
          style={{
            width: 40,
            height: 40,
            borderRadius: 6,
            border: '1px solid #d9d9d9',
            background: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            lineHeight: 1,
          }}
        >
          🗑
        </button>
      </div>
      <style jsx>{`
        .cart-item {
          display: grid;
          grid-template-columns: 80px 1fr 120px 140px 140px 56px;
          gap: 16px;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f0f0f0;
        }
        @media (max-width: 768px) {
          .cart-item {
            grid-template-columns: 80px 1fr 56px;
            grid-template-areas:
              'image title remove'
              'image price-each remove'
              'image quantity remove'
              'image sum remove';
            gap: 12px;
          }
          .cart-item__image { grid-area: image; }
          .cart-item__title { grid-area: title; }
          .cart-item__price-each { grid-area: price-each; }
          .cart-item__quantity { grid-area: quantity; }
          .cart-item__sum { grid-area: sum; }
          .cart-item__remove { grid-area: remove; }
          .cart-item__price-each, .cart-item__sum { justify-self: start; }
        }
      `}</style>
    </div>
  );
};

export default CartItem;
