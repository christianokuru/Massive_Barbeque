import { z } from "zod";
import { requireAdmin } from "~~/server/utils/supabase";
import { toOrder } from "~~/server/utils/mappers";
import { canAdminSetPaymentStatus, canTransitionOrder } from "~~/shared/utils/orderStatus";
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

    // Enforce the kitchen pipeline — no skips, no resurrections.
    const { data: current, error: currentError } = await supabase
      .from("orders")
      .select("status, payment_status")
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

    // Money states are provider-only: `paid` comes from verified webhooks,
    // `refunded` from the refund endpoint, and a paid/refunded order's
    // payment status can't be relabelled by hand (shared rule, also used
    // by the admin UI).
    const currentPayment = (current as any).payment_status;
    const paymentChanging = !!body.paymentStatus && body.paymentStatus !== currentPayment;
    if (paymentChanging) {
      const check = canAdminSetPaymentStatus(currentPayment, body.paymentStatus);
      if (!check.ok) {
        throw createError({ statusCode: 400, statusMessage: check.reason });
      }
    }

    const updateData: Record<string, any> = {
      status: body.status,
      updated_at: new Date().toISOString(),
    };

    if (paymentChanging) {
      updateData.payment_status = body.paymentStatus;
    }

    // Fail-closed ordering: the audit row is written BEFORE the state
    // change. If auditing throws, this handler 500s with the order
    // untouched — a status change without a trail can never commit.
    // (The reverse — a trail for a write that then fails — is the safe
    // direction: it records intent, never a silent change.)
    // The audit target records both changes so a payment relabel is never
    // hidden inside a plain status change.
    const auditTarget = [
      orderId,
      `status:${(current as any).status}->${body.status}`,
      paymentChanging ? `payment:${currentPayment}->${body.paymentStatus}` : "",
    ].filter(Boolean).join(" ");
    await auditAdminAction(
      user.email || null,
      "status_change",
      auditTarget,
      getClientIp(event)
    );

    const { error: updateError } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", orderId);
    if (updateError) throw updateError;

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
      statusMessage: "Failed to update order status",
    });
  }
});
