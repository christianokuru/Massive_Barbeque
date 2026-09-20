// Pure order-pricing helpers shared by server routes and the checkout page.
// Prices arrive from Postgres `decimal` columns as strings — always convert
// with `toAmount` before doing arithmetic. All values are in Naira.

export const DELIVERY_FEE_FLAT = 2000;

export type FulfillmentType = 'delivery' | 'pickup';

/** Safely parse a decimal-string (or number) price into a number. Invalid → 0. */
export function toAmount(value: string | number | null | undefined): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Total for one line: unit price × quantity. */
export function lineTotal(unitPrice: string | number, quantity: number): number {
  return toAmount(unitPrice) * Math.max(0, Math.floor(quantity));
}

export interface PricedItem {
  price: string | number;
  quantity: number;
}

/** Sum of all cart/order lines. */
export function cartSubtotal(items: PricedItem[]): number {
  return items.reduce((sum, i) => sum + lineTotal(i.price, i.quantity), 0);
}

/** Flat delivery fee — applied only to home delivery, never pickup. */
export function deliveryFeeFor(fulfillmentType: FulfillmentType): number {
  return fulfillmentType === 'delivery' ? DELIVERY_FEE_FLAT : 0;
}

export interface OrderTotals {
  subtotal: number;
  deliveryFee: number;
  total: number;
}

/** Subtotal + delivery fee for the given fulfillment type. */
export function orderTotals(subtotal: number, fulfillmentType: FulfillmentType): OrderTotals {
  const deliveryFee = deliveryFeeFor(fulfillmentType);
  return { subtotal, deliveryFee, total: subtotal + deliveryFee };
}

/** Convert Naira to kobo (smallest unit) for Paystack. Rounds to whole kobo. */
export function toKobo(naira: string | number): number {
  return Math.round(toAmount(naira) * 100);
}

/** Format for display, e.g. 12500 → "₦12,500". */
export function formatNaira(amount: string | number): string {
  return `₦${Math.round(toAmount(amount)).toLocaleString('en-NG')}`;
}

/**
 * Week-over-week style percentage change, rounded to whole points.
 * Returns null when the baseline is 0 (no meaningful delta) — callers
 * hide the badge instead of showing ±∞.
 */
export function pctChange(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous <= 0) {
    return null;
  }
  if (current === previous) return 0;
  return Math.round(((current - previous) / previous) * 100);
}
