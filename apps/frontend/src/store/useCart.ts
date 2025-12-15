'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import toast from 'react-hot-toast';
import { Product } from '../shared/api/catalog';

export interface CartItem {
  id: string; // уникальный ID элемента корзины
  product: Product;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalQuantity: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addToCart: (product, quantity = 1) => {
        const items = get().items;
        const existingItem = items.find((item) => item.product.id === product.id);

        if (existingItem) {
          // Обновить количество существующего товара
          const newQuantity = existingItem.quantity + quantity;
          set({
            items: items.map((item) =>
              item.product.id === product.id
                ? { ...item, quantity: newQuantity }
                : item,
            ),
          });
          toast.success(`Количество увеличено до ${newQuantity}`);
        } else {
          // Добавить новый товар
          const newItem: CartItem = {
            id: `cart-${Date.now()}-${product.id}`,
            product,
            quantity,
          };
          set({ items: [...items, newItem] });
          toast.success('Товар добавлен в корзину');
        }

        console.log('Cart updated:', get().items); // Для отладки
      },

      removeFromCart: (itemId) => {
        set({ items: get().items.filter((item) => item.id !== itemId) });
        toast.success('Товар удален из корзины');
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(itemId);
          return;
        }

        set({
          items: get().items.map((item) =>
            item.id === itemId ? { ...item, quantity } : item,
          ),
        });
      },

      clearCart: () => {
        set({ items: [] });
        toast.success('Корзина очищена');
      },

      getTotalQuantity: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0,
        );
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

// Экспорт для обратной совместимости
export const useCart = useCartStore;
export default useCartStore;
