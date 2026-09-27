import { requireAdmin } from "~~/server/utils/supabase";
import { toOrder } from "~~/server/utils/mappers";

// Bounded: limit defaults to 200, hard-capped at 1000. The archive UI
// passes an explicit high limit so its tabs/search/bulk stay truthful;
// unbounded dumps are no longer possible. True infinite scale wants
// keyset pagination — a later pass, not this one.
const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 1000;

export default defineEventHandler(async (event) => {
  try {
    const { supabase } = await requireAdmin(event);

    const query = getQuery(event);
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number(query.limit) || DEFAULT_LIMIT));
    const offset = Math.max(0, Number(query.offset) || 0);

    const { data, error, count } = await supabase
      .from("orders")
      .select("*, order_items(*)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;

    return {
      orders: (data || []).map(toOrder),
      pagination: { total: count ?? 0, limit, offset },
    };
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
