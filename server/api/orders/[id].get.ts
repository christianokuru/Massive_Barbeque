import { getAuthUser } from "~~/server/utils/supabase";
import { toOrder } from "~~/server/utils/mappers";

export default defineEventHandler(async (event) => {
  try {
    const { supabase, user } = await getAuthUser(event);
    const userId = user?.id ?? null;
    const orderId = getRouterParam(event, "id");

    if (!orderId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Order ID is required",
      });
    }

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

    // Owner, admin, or guest orders (user_id null) may view.
    const role = (user?.app_metadata as any)?.role;
    if (order.user_id && order.user_id !== userId && role !== "admin") {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
      });
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
