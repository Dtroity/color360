import ReactGA from "react-ga4";

/**
 * Универсальная отправка пользовательских событий GA4.
 * Пример e-commerce:
 * trackEvent("view_item", { items: [{ item_id: "SKU123", item_name: "Camera Pro" }] });
 * trackEvent("add_to_cart", { currency: "RUB", value: 19990, items: [...] });
 */
export function trackEvent(eventName: string, params?: Record<string, any>) {
  try {
    ReactGA.event(eventName, params);
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      // Логируем только в дев среде чтобы не шуметь в продакшене
      // eslint-disable-next-line no-console
      console.warn("GA event error", e);
    }
  }
}
