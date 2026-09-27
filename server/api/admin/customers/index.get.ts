import { requireAdmin, getServiceSupabase } from "~~/server/utils/supabase";

// Registered customers (non-admins), 20 per page, each with their placed
// order count from a single aggregate query — no N+1. Admins excluded;
// guests (no account) never appear here by design.
const PER_PAGE = 20;
const MAX_PAGES = 500;

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event);

    const query = getQuery(event);
    const page = Math.min(MAX_PAGES, Math.max(1, Number(query.page) || 1));

    const admin = getServiceSupabase();
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PER_PAGE });
    if (error) throw error;
    const users = (data?.users || []).filter((u) => (u.app_metadata as any)?.role !== "admin");

    const ids = users.map((u) => u.id);
    let counts = new Map<string, number>();
    if (ids.length) {
      const { data: orders, error: ordersError } = await admin
        .from("orders")
        .select("user_id")
        .in("user_id", ids);
      if (ordersError) throw ordersError;
      for (const o of orders || []) {
        counts.set(o.user_id, (counts.get(o.user_id) ?? 0) + 1);
      }
    }

    return {
      customers: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: (u.user_metadata as any)?.name ?? null,
        lastSignIn: u.last_sign_in_at ?? null,
        createdAt: u.created_at,
        orderCount: counts.get(u.id) ?? 0,
      })),
      pagination: { page, perPage: PER_PAGE, hasMore: (data?.users || []).length >= PER_PAGE },
    };
  } catch (error: any) {
    console.error("Admin customers fetch error:", error?.message || error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch customers",
    });
  }
});
