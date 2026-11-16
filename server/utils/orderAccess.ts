import type { H3Event } from "h3";
import { getAuthUser } from "~~/server/utils/supabase";
import { getGuestTokenSecret, verifyGuestToken } from "~~/server/utils/guestToken";
import { apiError, isUuid } from "~~/server/utils/api";
import { db, must } from "~~/server/utils/db";

export interface OrderAccessRow {
  id: string;
  user_id: string | null;
  customer_email: string;
  total: string | number;
  payment_method: string;
  payment_status: string;
  status: string;
}

export type OrderViewer = "admin" | "owner" | "guest";

const norm = (v: unknown) => String(v ?? "").trim().toLowerCase();

/**
 * Who may act on an order — the single rule every order route uses
 * (view, cancel, start payment, check payment):
 *
 *   - admins: any order
 *   - the account that placed it (orders.user_id)
 *   - for a guest order (no user_id):
 *       · a signed-in customer whose CONFIRMED email matches the order
 *         (the same rule that shows it in their order list), or
 *       · anyone holding the signed guest pass issued at checkout
 *
 * Pure so it can be unit-tested. Returns null when access is denied.
 */
export function orderViewer(
  order: { id: string; user_id: string | null; customer_email: string | null },
  user: { id?: string; email?: string | null; email_confirmed_at?: string | null; app_metadata?: any } | null,
  guestProofEmail: string | null,
): OrderViewer | null {
  if (user && user.app_metadata?.role === "admin") return "admin";
  if (order.user_id) {
    return user?.id && user.id === order.user_id ? "owner" : null;
  }
  if (user?.email_confirmed_at && user.email && norm(user.email) === norm(order.customer_email)) {
    return "owner";
  }
  if (guestProofEmail && guestProofEmail === norm(order.customer_email)) return "guest";
  return null;
}

/**
 * Load an order the caller is allowed to act on, or 404. Denials are 404
 * (never 403) so strangers can't tell whether an order id exists.
 */
export async function assertOrderAccess(
  event: H3Event | any,
  orderId: string,
  guestToken?: string,
  select = "id, user_id, customer_email, total, payment_method, payment_status, status",
): Promise<{ order: OrderAccessRow & Record<string, any>; viewer: OrderViewer; user: any }> {
  if (!isUuid(orderId)) apiError(404, "Order not found.");
  const order = must(
    await db().from("orders").select(select).eq("id", orderId).maybeSingle(),
  ) as any;
  if (!order) apiError(404, "Order not found.");

  const { user } = await getAuthUser(event);
  let proofEmail: string | null = null;
  if (!order.user_id && guestToken) {
    const proof = verifyGuestToken(String(guestToken), order.id, getGuestTokenSecret(event));
    proofEmail = proof ? norm(proof.email) : null;
  }
  const viewer = orderViewer(order, user as any, proofEmail);
  if (!viewer) apiError(404, "Order not found.");
  return { order, viewer, user };
}
