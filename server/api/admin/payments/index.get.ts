import { requireAdmin, getServiceSupabase } from "~~/server/utils/supabase";

// Money reconciliation: every payment attempt, newest first, with the
// order number attached. Read-only — states change only via webhooks,
// verify-settling, or the owner refund endpoint.
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event);

    const query = getQuery(event);
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number(query.limit) || DEFAULT_LIMIT));
    const offset = Math.max(0, Number(query.offset) || 0);

    const admin = getServiceSupabase();
    const { data, error, count } = await admin
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
        paidAt: p.paid_at,
        createdAt: p.created_at,
      })),
      pagination: { total: count ?? 0, limit, offset },
    };
  } catch (error: any) {
    console.error("Admin payments fetch error:", error?.message || error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch payments",
    });
  }
});
