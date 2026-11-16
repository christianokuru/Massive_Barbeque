import { z } from "zod";
import { defineApi, parseQuery } from "~~/server/utils/api";
import { db, must } from "~~/server/utils/db";
import { requireAdmin } from "~~/server/utils/supabase";

// GET /api/admin/customers?page= — registered customers (admins excluded,
// guests never listed), 20 per page, each with order count and lifetime
// paid spend from one aggregate query (no N+1).
const PER_PAGE = 20;
const querySchema = z.object({ page: z.coerce.number().int().min(1).max(500).catch(1).default(1) });

export default defineApi(async (event) => {
  await requireAdmin(event);
  const { page } = parseQuery(event, querySchema);

  const { data, error } = await db().auth.admin.listUsers({ page, perPage: PER_PAGE });
  if (error) throw error;
  const pageUsers = data?.users || [];
  const users = pageUsers.filter((u) => (u.app_metadata as any)?.role !== "admin");

  const stats = new Map<string, { orders: number; spent: number; lastOrderAt: string | null }>();
  if (users.length) {
    const rows = must(
      await db()
        .from("orders")
        .select("user_id, total, status, payment_status, created_at")
        .in("user_id", users.map((u) => u.id)),
    ) as any[];
    for (const o of rows) {
      const s = stats.get(o.user_id) ?? { orders: 0, spent: 0, lastOrderAt: null };
      s.orders += 1;
      if (o.payment_status === "paid" && o.status !== "cancelled") s.spent += Number(o.total) || 0;
      if (!s.lastOrderAt || o.created_at > s.lastOrderAt) s.lastOrderAt = o.created_at;
      stats.set(o.user_id, s);
    }
  }

  return {
    customers: users.map((u) => ({
      id: u.id,
      email: u.email,
      name: (u.user_metadata as any)?.name ?? null,
      emailConfirmed: !!u.email_confirmed_at,
      lastSignIn: u.last_sign_in_at ?? null,
      createdAt: u.created_at,
      orderCount: stats.get(u.id)?.orders ?? 0,
      totalSpent: stats.get(u.id)?.spent ?? 0,
      lastOrderAt: stats.get(u.id)?.lastOrderAt ?? null,
    })),
    // Paging is over auth users (admins filtered after), so "more" is
    // decided by the raw page being full.
    pagination: { page, perPage: PER_PAGE, hasMore: pageUsers.length >= PER_PAGE },
  };
});
