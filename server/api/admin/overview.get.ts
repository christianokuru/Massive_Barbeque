import { requireAdmin, getServiceSupabase } from "~~/server/utils/supabase";
import { toOrder } from "~~/server/utils/mappers";
import { ATTENTION_STATUSES } from "~~/shared/utils/orderStatus";
import {
  buildRevenueSeries,
  needsAttentionRows,
  revenueDeltaFor,
} from "~~/shared/utils/orderDisplay";
import { countCustomers } from "~~/server/utils/customerCount";

// The dashboard home in one round trip: aggregates + the 20-row action
// queue. Lean columns only — the full order dump lives on
// GET /api/admin/orders (the archive's job, not the home page's).
export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event);
    const admin = getServiceSupabase();

    const { data: rows, error: ordersError } = await admin
      .from("orders")
      .select(
        "id, order_number, status, payment_status, total, customer_name, customer_email, created_at, order_items(quantity)"
      )
      .order("created_at", { ascending: false });
    if (ordersError) throw ordersError;

    const [{ count: activeProducts, error: productsError }, totalCustomers] =
      await Promise.all([
        admin.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
        countCustomers(),
      ]);
    if (productsError) throw productsError;

    const orders = (rows ?? []).map(toOrder);
    const paid = orders.filter((o) => o.paymentStatus === "paid");

    return {
      stats: {
        revenue: paid.reduce((sum, o) => sum + Number(o.total || 0), 0),
        revenueDeltaPct: revenueDeltaFor(orders),
        totalOrders: orders.length,
        pendingOrders: orders.filter((o) => o.status === "pending").length,
        activeProducts: activeProducts ?? 0,
        totalCustomers,
      },
      revenueSeries: buildRevenueSeries(orders),
      attention: needsAttentionRows(orders, ATTENTION_STATUSES, 20),
    };
  } catch (error: any) {
    console.error("Admin overview error:", error?.message || error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to load overview",
    });
  }
});
