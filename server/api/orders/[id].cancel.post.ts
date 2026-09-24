import { z } from "zod";
import { getServiceSupabase } from "~~/server/utils/supabase";
import { toOrder } from "~~/server/utils/mappers";
import { canUserCancelOrder } from "~~/shared/utils/orderStatus";
import { assertOrderAccess } from "~~/server/utils/orderAccess";
import { isRateLimited } from "~~/server/utils/rateLimit";
import { getClientIp } from "~~/server/utils/clientIp";

const cancelSchema = z.object({
  // Signed guest token (required for guest orders — UUID alone is
  // not authorization). Capped string, never objects.
  guestToken: z.string().max(4096).optional(),
});

// Buyer self-cancel: pending + unpaid orders only (same rule the UI
// previews with canUserCancelOrder). Paid or confirmed orders go through
// staff — cancelling paid money here would keep the cash and kill the
// food, and confirmed orders may already be on the grill.
export default defineEventHandler(async (event) => {
  try {
    const rawId = getRouterParam(event, "id");
    const parsedId = z.string().uuid().safeParse(rawId);
    if (!parsedId.success) {
      throw createError({ statusCode: 404, statusMessage: "Order not found." });
    }
    const orderId = parsedId.data;

    const ip = getClientIp(event);
    const { limited } = isRateLimited(`order-cancel:${ip}:${orderId}`, {
      limit: 10,
      windowSecs: 3600,
    });
    if (limited) {
      throw createError({ statusCode: 429, statusMessage: "Too many attempts. Try again later." });
    }

    const body = await readValidatedBody(event, cancelSchema.parse);
    const { order } = await assertOrderAccess(event, orderId, body.guestToken);

    const check = canUserCancelOrder(order.status, order.payment_status);
    if (!check.ok) {
      throw createError({ statusCode: 400, statusMessage: check.reason });
    }

    const service = getServiceSupabase();
    const { error: updateError } = await service
      .from("orders")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", orderId);
    if (updateError) throw updateError;

    const { data: full, error: fetchError } = await service
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();
    if (fetchError) throw fetchError;

    return { success: true, order: toOrder(full) };
  } catch (error: any) {
    console.error("Order cancel error:", error?.message || error);

    if (error instanceof z.ZodError) {
      throw createError({ statusCode: 400, statusMessage: "Invalid request." });
    }
    if (error?.statusCode) throw error;

    throw createError({ statusCode: 500, statusMessage: "Failed to cancel order." });
  }
});
