import { trackEvent } from "@/lib/analytics";

// Типы можно расширять по мере необходимости
export interface ProductForAnalytics {
  id: string | number;
  name: string;
  price: number;
  category?: string;
  brand?: string;
  quantity?: number;
}

export interface OrderForAnalytics {
  id: string | number;
  total: number;
  currency: string;
  items: Array<{
    id: string | number;
    name: string;
    price: number;
    quantity: number;
    category?: string;
    brand?: string;
  }>;
}

function mapProduct(p: ProductForAnalytics) {
  return {
    item_id: String(p.id),
    item_name: p.name,
    price: p.price,
    item_category: p.category,
    item_brand: p.brand,
    quantity: p.quantity ?? 1,
  };
}

export function trackViewItem(product: ProductForAnalytics) {
  trackEvent("view_item", { items: [mapProduct(product)] });
}

export function trackAddToCart(product: ProductForAnalytics, quantity: number) {
  trackEvent("add_to_cart", {
    currency: "RUB",
    value: product.price * quantity,
    items: [mapProduct({ ...product, quantity })],
  });
}

export function trackBeginCheckout(items: ProductForAnalytics[], value: number) {
  trackEvent("begin_checkout", {
    currency: "RUB",
    value,
    items: items.map((p) => mapProduct(p)),
  });
}

export function trackPurchase(order: OrderForAnalytics) {
  trackEvent("purchase", {
    transaction_id: String(order.id),
    currency: order.currency || "RUB",
    value: order.total,
    items: order.items.map((p) => mapProduct(p)),
  });
}
