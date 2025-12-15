export interface AddToCartPayload {
  productId: number;
  quantity: number;
}

export const useCart = () => {
  const addToCart = (payload: AddToCartPayload) => {
    // TODO: Реализовать добавление в корзину
    // Временно: логирование
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.log('addToCart', payload);
    }
  };

  return { addToCart };
};
