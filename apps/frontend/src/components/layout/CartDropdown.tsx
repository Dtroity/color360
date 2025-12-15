'use client';

import { useCartStore } from '@/store/useCart';
import Image from 'next/image';
import Link from 'next/link';
import { X, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { resolveImageUrl } from '@/shared/lib/resolveImageUrl';

export function CartDropdown({ onClose }: { onClose?: () => void }) {
  const items = useCartStore((s) => s.items);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const getTotalPrice = useCartStore((s) => s.getTotalPrice);

  if (items.length === 0) {
    return (
      <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl p-6 z-50">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded transition"
            aria-label="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <div className="flex flex-col items-center justify-center py-8">
          <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
          <p className="text-gray-500 text-center mb-4">Корзина пуста</p>
          <Link
            href="/catalog"
            className="block w-full"
            onClick={onClose}
          >
            <Button className="w-full">Перейти в каталог</Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalPrice = getTotalPrice();
  const currency = items[0]?.product.currency || 'RUB';

  return (
    <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl p-4 z-50 max-h-[500px] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">Корзина ({items.length})</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition"
            aria-label="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-3 mb-4">
        {items.slice(0, 3).map((item) => {
          const mainImage = item.product.images?.[0];
          const imgSrc = resolveImageUrl(mainImage?.url);
          const imgAlt = mainImage?.alt || item.product.name;

          return (
            <div key={item.id} className="flex gap-3 items-start">
              <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-neutral-100">
                <Image
                  src={imgSrc}
                  alt={imgAlt}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-2 text-neutral-900">
                  {item.product.name}
                </p>
                <p className="text-sm text-neutral-500 mt-1">
                  {item.quantity} × {item.product.price.toLocaleString('ru-RU')} {item.product.currency}
                </p>
              </div>
              <button
                onClick={() => removeFromCart(item.id)}
                className="text-red-500 hover:text-red-700 transition p-1"
                aria-label="Удалить товар"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}

        {items.length > 3 && (
          <p className="text-sm text-neutral-500 text-center py-2">
            еще {items.length - 3} товар(ов)
          </p>
        )}
      </div>

      <div className="border-t border-neutral-200 pt-4 mb-4">
        <div className="flex justify-between font-semibold mb-4 text-lg">
          <span>Итого:</span>
          <span>{totalPrice.toLocaleString('ru-RU')} ₽</span>
        </div>

        <div className="space-y-2">
          <Link href="/cart" className="block w-full" onClick={onClose}>
            <Button variant="outline" className="w-full">
              Перейти в корзину
            </Button>
          </Link>
          <Link href="/checkout" className="block w-full" onClick={onClose}>
            <Button className="w-full">Оформить заказ</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default CartDropdown;
