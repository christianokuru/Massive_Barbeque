import { getServiceSupabase } from "~~/server/utils/supabase";

// Customer count shared by the count endpoint and the overview endpoint.
// Cached (60s) and page-capped: every call used to page the entire
// auth.users table, so one admin session could DoS the endpoint.
let cached: { total: number; at: number } | null = null;
const CACHE_MS = 60_000;
const MAX_PAGES = 10;

/** Registered non-admin users (single cached source for admin stats). */
export async function countCustomers(): Promise<number> {
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return cached.total;
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

  return total;
}
