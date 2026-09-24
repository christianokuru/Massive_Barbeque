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

/**
 * Split a bulk status change into orders that may legally move to `target`
 * and orders that must be skipped. Pure so the console can preview counts
 * before sending anything — the server still re-validates every row.
 */
export function planBulkStatusChange(
  rows: Array<{ id: string; status: string }>,
  target: OrderStatus,
): { apply: string[]; skipped: string[] } {
  const apply: string[] = [];
  const skipped: string[] = [];
  for (const row of rows) {
    if (canTransitionOrder(row.status as OrderStatus, target)) apply.push(row.id);
    else skipped.push(row.id);
  }
  return { apply, skipped };
}

/** States that need kitchen attention (everything not terminal). */
export const ATTENTION_STATUSES: readonly string[] = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
];

/** Terminal states: webhooks must never move an order out of these. */
export const TERMINAL_ORDER_STATUSES = ['completed', 'cancelled'] as const;

/** Is this status terminal (completed/cancelled)? Unknown values → false. */
export function isTerminalOrderStatus(status: unknown): boolean {
  return (
    typeof status === "string" &&
    (TERMINAL_ORDER_STATUSES as readonly string[]).includes(status)
  );
}

/**
 * May the buyer cancel this order themselves? Same rule on both sides:
 * the dashboard previews with it, the cancel endpoint enforces it.
 * Paid orders are excluded — without a refund integration, cancelling
 * paid money would keep the cash and kill the food.
 */
export function canUserCancelOrder(
  status: unknown,
  paymentStatus: unknown,
): { ok: boolean; reason: string } {
  // Narrower than the kitchen pipeline on purpose: once an order is
  // confirmed the kitchen may have fired the grill, so only pending
  // orders self-cancel. Anything further needs staff (contact us).
  if (status !== "pending") {
    return {
      ok: false,
      reason: "Only pending orders can be cancelled here — contact us for anything already confirmed.",
    };
  }
  if (paymentStatus === "paid") {
    return {
      ok: false,
      reason: "This order is already paid — contact us and we'll arrange a refund.",
    };
  }
  return { ok: true, reason: "" };
}
