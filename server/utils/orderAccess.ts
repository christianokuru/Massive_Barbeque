import { getServiceSupabase, getAuthUser } from "~~/server/utils/supabase";
import { getGuestTokenSecret, verifyGuestToken } from "~~/server/utils/guestToken";

export interface OrderAccessRow {
  id: string;
  user_id: string | null;
  customer_email: string;
  total: string | number;
  payment_method: string;
  payment_status: string;
  status: string;
}

// Ownership gate for anything order-scoped (pay init/verify, receipts).
// Owner (session user_id match), admin, or guest presenting the HMAC
// token issued at order-create (bound to order id + buyer email).
// Throws 404 — never 403 — so probers can't confirm order existence.
export async function assertOrderAccess(
  event: any,
  orderId: string,
  guestToken?: string
): Promise<{ order: OrderAccessRow }> {
  const supabase = getServiceSupabase();
  const { data: order } = await supabase
    .from("orders")
    .select("id, user_id, customer_email, total, payment_method, payment_status, status")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) {
    throw createError({ statusCode: 404, statusMessage: "Order not found." });
  }

  const { user } = await getAuthUser(event);
  const role = (user?.app_metadata as any)?.role;
  if (role === "admin") return { order: order as OrderAccessRow };
  if (order.user_id && user && order.user_id === user.id) {
    return { order: order as OrderAccessRow };
  }
  if (!order.user_id) {
    const proof = verifyGuestToken(
      String(guestToken || ""),
      order.id,
      getGuestTokenSecret(event)
    );
    if (proof && proof.email === String(order.customer_email || "").toLowerCase()) {
      return { order: order as OrderAccessRow };
    }
  }
  throw createError({ statusCode: 404, statusMessage: "Order not found." });
}
