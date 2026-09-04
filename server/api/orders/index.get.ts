import { requireUser } from "~~/server/utils/supabase";
import { toOrder } from "~~/server/utils/mappers";

export default defineEventHandler(async (event) => {
  try {
    const { supabase, user } = await requireUser(event);

    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;

    return { orders: (data || []).map(toOrder) };
  } catch (error: any) {
    console.error("Orders fetch error:", error?.message || error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch orders",
    });
  }
});
