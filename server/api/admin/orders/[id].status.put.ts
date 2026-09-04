import { z } from "zod";
import { requireAdmin } from "~~/server/utils/supabase";
import { toOrder } from "~~/server/utils/mappers";

const orderStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "preparing", "ready", "completed", "cancelled"]),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]).optional(),
});

export default defineEventHandler(async (event) => {
  try {
    const { supabase } = await requireAdmin(event);

    const orderId = getRouterParam(event, "id");

    if (!orderId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Order ID is required",
      });
    }

    const body = await readValidatedBody(event, orderStatusSchema.parse);

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
