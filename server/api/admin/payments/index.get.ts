import { defineApi, pageQuery } from "~~/server/utils/api";
import { db } from "~~/server/utils/db";
import { requireAdmin } from "~~/server/utils/supabase";

// GET /api/admin/payments?limit=&offset= — every payment attempt, newest
// first, with its order number. Read-only: states change only via
// webhooks, verify-settling, or the owner refund endpoint.
export default defineApi(async (event) => {
  await requireAdmin(event);
  const { limit, offset } = pageQuery(event, { limit: 100, max: 500 });
  const { data, error, count } = await db()
    .from("payments")
    .select("*, orders(order_number)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return {
    payments: (data || []).map((p: any) => ({
      id: p.id,
      orderId: p.order_id,
      orderNumber: p.orders?.order_number ?? null,
      provider: p.provider,
      reference: p.reference,
      amount: String(p.amount ?? "0"),
      currency: p.currency,
      status: p.status,
      refundStatus: p.refund_status ?? null,
      paidAt: p.paid_at,
      createdAt: p.created_at,
    })),
    pagination: { total: count ?? 0, limit, offset },
  };
});
