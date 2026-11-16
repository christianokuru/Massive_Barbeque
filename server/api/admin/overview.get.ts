import { defineApi } from "~~/server/utils/api";
import { db, must } from "~~/server/utils/db";
import { requireAdmin } from "~~/server/utils/supabase";
import { toOrder } from "~~/server/utils/mappers";
import { ATTENTION_STATUSES } from "~~/shared/utils/orderStatus";
import { isRevenueOrder } from "~~/shared/utils/pricing";
import { buildRevenueSeries, needsAttentionRows, revenueDeltaFor } from "~~/shared/utils/orderDisplay";
import { countCustomers } from "~~/server/utils/customerCount";

// GET /api/admin/overview — the dashboard home in one round trip:
// headline stats, a 90-day revenue series and the 20-row action queue.
// Lean columns only; the full archive lives on /api/admin/orders.
export default defineApi(async (event) => {
  await requireAdmin(event);

  const [rows, products, totalCustomers] = await Promise.all([
    db()
      .from("orders")
      .select("id, order_number, status, payment_status, total, customer_name, customer_email, created_at, order_items(quantity)")
      .order("created_at", { ascending: false })
      .limit(20000),
    db().from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
    countCustomers(),
  ]);
  if (products.error) throw products.error;

  const orders = (must(rows) || []).map(toOrder);
  // Revenue = paid and kept. Cancelled orders are refund-owed, not revenue.
  const revenueOrders = orders.filter((o: any) => isRevenueOrder(o.status, o.paymentStatus));

  return {
    stats: {
      revenue: revenueOrders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0),
      revenueDeltaPct: revenueDeltaFor(revenueOrders),
      totalOrders: orders.length,
      pendingOrders: orders.filter((o: any) => o.status === "pending").length,
      activeProducts: products.count ?? 0,
      totalCustomers,
    },
    revenueSeries: buildRevenueSeries(revenueOrders),
    attention: needsAttentionRows(orders, ATTENTION_STATUSES, 20),
  };
});
