import { z } from "zod";
import { requireAdmin } from "~~/server/utils/supabase";
import { toOrder } from "~~/server/utils/mappers";
import { canTransitionOrder } from "~~/shared/utils/orderStatus";
import { auditAdminAction } from "~~/server/utils/adminGovernance";
import { getClientIp } from "~~/server/utils/clientIp";

const orderStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "preparing", "ready", "completed", "cancelled"]),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]).optional(),
});

export default defineEventHandler(async (event) => {
  try {
    const { supabase, user } = await requireAdmin(event);

    const orderId = getRouterParam(event, "id");

    if (!orderId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Order ID is required",
      });
    }

    const body = await readValidatedBody(event, orderStatusSchema.parse);

    // `paid` is webhook-only: no admin (or compromised admin session)
    // may mint it by hand.
    if (body.paymentStatus === "paid") {
      throw createError({
        statusCode: 400,
        statusMessage: "Paid status is set by payment webhooks only.",
      });
    }

    // Enforce the kitchen pipeline — no skips, no resurrections.
    const { data: current, error: currentError } = await supabase
      .from("orders")
      .select("status")
      .eq("id", orderId)
      .single();
    if (currentError || !current) {
      throw createError({ statusCode: 404, statusMessage: "Order not found." });
    }
    if (!canTransitionOrder((current as any).status, body.status)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Cannot move order from ${(current as any).status} to ${body.status}.`,
      });
    }

    const updateData: Record<string, any> = {
      status: body.status,
      updated_at: new Date().toISOString(),
    };

    if (body.paymentStatus) {
      updateData.payment_status = body.paymentStatus;
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", orderId);
    if (updateError) throw updateError;

    // Audited, fail-closed: a status change without a trail is a 500.
    await auditAdminAction(
      user.email || null,
      "status_change",
      orderId,
      getClientIp(event)
    );

    const { data: order, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();
    if (error) throw error;

    return {
      success: true,
      order: toOrder(order),
    };
  } catch (error: any) {
    console.error("Order status update error:", error?.message || error);

    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid form data",
        data: error.errors,
      });
    }
    if (error?.statusCode) throw error;

    throw createError({
      statusCode: 500,
      statusMessage: error?.message || "Failed to update order status",
    });
  }
});
