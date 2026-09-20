// Order lifecycle helpers. Mirrors the status enums enforced by
// `server/api/admin/orders/[id].status.put.ts`.

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'completed',
  'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/**
 * Legal next statuses from each state. Forward-only through the kitchen
 * pipeline; `cancelled` is reachable until completion; `completed` and
 * `cancelled` are terminal.
 */
const NEXT: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ['pending', 'confirmed', 'cancelled'],
  confirmed: ['confirmed', 'preparing', 'cancelled'],
  preparing: ['preparing', 'ready', 'cancelled'],
  ready: ['ready', 'completed', 'cancelled'],
  completed: ['completed'],
  cancelled: ['cancelled'],
};

/** Is moving an order from `from` to `to` a legal transition? */
export function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean {
  return NEXT[from]?.includes(to) ?? false;
}

/**
 * Legal targets (including the current state) for an order sitting in
 * `from`. Single source of truth for every status dropdown — admin UI and
 * API validation must derive from here, never from a hardcoded list.
 */
export function legalNextStatuses(from: OrderStatus): readonly OrderStatus[] {
  return NEXT[from] ?? [];
}

/**
 * Payment states an admin may hand-set. `paid` is deliberately absent:
 * only payment webhooks (after provider re-verification) may mint it.
 * The admin status endpoint enforces this same list — see
 * `server/api/admin/orders/[id].status.put.ts`.
 */
export const ADMIN_EDITABLE_PAYMENT_STATUSES = ['pending', 'failed', 'refunded'] as const;

export type AdminEditablePaymentStatus = (typeof ADMIN_EDITABLE_PAYMENT_STATUSES)[number];
