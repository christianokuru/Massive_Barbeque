import { requireAdmin } from "~~/server/utils/supabase";
import { getServiceSupabase } from "~~/server/utils/supabase";

// Cached (60s) and page-capped: every call used to page the entire
// auth.users table, so one admin session could DoS the endpoint.
let cached: { total: number; at: number } | null = null;
const CACHE_MS = 60_000;
const MAX_PAGES = 10;

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event);

    if (cached && Date.now() - cached.at < CACHE_MS) {
      return { totalCustomers: cached.total };
    }

    const admin = getServiceSupabase();
    let total = 0;
    let page = 1;
    const perPage = 1000;
    for (;;) {
      if (page > MAX_PAGES) break;
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
      if (error) throw error;
      const users = data?.users ?? [];
      // Admins aren't customers.
      total += users.filter((u) => (u.app_metadata as any)?.role !== "admin").length;
      if (users.length < perPage) break;
      page += 1;
    }
    cached = { total, at: Date.now() };

    return { totalCustomers: total };
  } catch (error: any) {
    console.error("Admin customer count error:", error?.message || error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to count customers",
    });
  }
});
