import { requireAdmin } from "~~/server/utils/supabase";
import { toOrder } from "~~/server/utils/mappers";

export default defineEventHandler(async (event) => {
  try {
    const { supabase } = await requireAdmin(event);

    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });
    if (error) throw error;

    return { orders: (data || []).map(toOrder) };
  } catch (error: any) {
    console.error("Admin orders fetch error:", error?.message || error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch orders",
    });
  }
});
