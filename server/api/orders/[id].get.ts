import { getServiceSupabase, getAuthUser } from "~~/server/utils/supabase";
import { toOrder } from "~~/server/utils/mappers";
import { isRateLimited } from "~~/server/utils/rateLimit";
import { getClientIp } from "~~/server/utils/clientIp";
import { getGuestTokenSecret, verifyGuestToken } from "~~/server/utils/guestToken";

export default defineEventHandler(async (event) => {
  try {
    // PII-bearing read: throttled per IP to blunt UUID-probing.
    const ip = getClientIp(event);
    const { limited } = isRateLimited(`order-read:${ip}`, { limit: 120, windowSecs: 3600 });
    if (limited) {
      throw createError({ statusCode: 429, statusMessage: "Too many requests. Try again later." });
    }
    // Identity only — the read uses the service role because RLS has no
    // select policy covering guest orders. Authorization stays in code
    // below: owner, admin, or guest order WITH a valid signed token.
    const { user } = await getAuthUser(event);
    const userId = user?.id ?? null;
    const orderId = getRouterParam(event, "id");

    if (!orderId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Order ID is required",
      });
    }

    const supabase = getServiceSupabase();
    const { data: order, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      throw createError({
        statusCode: 404,
        statusMessage: "Order not found",
      });
    }

    // Owner, admin, or guest-with-token may view. Guest orders require
    // the HMAC token issued at order-create (bound to order id + buyer
    // email) — UUID alone authorizes nothing. Denied guests get 404
    // (not 403) to avoid confirming order existence.
    const role = (user?.app_metadata as any)?.role;
    if (order.user_id) {
      if (order.user_id !== userId && role !== "admin") {
        throw createError({ statusCode: 404, statusMessage: "Order not found" });
      }
    } else if (role !== "admin") {
      const query = getQuery(event);
      const proof = verifyGuestToken(
        String(query.token || ""),
        order.id,
        getGuestTokenSecret(event)
      );
      if (!proof || proof.email !== String(order.customer_email || "").toLowerCase()) {
        throw createError({ statusCode: 404, statusMessage: "Order not found" });
      }
    }

    return { order: toOrder(order) };
  } catch (error: any) {
    console.error("Order fetch error:", error?.message || error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch order",
    });
  }
});
