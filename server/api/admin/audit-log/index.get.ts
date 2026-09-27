import { requireAdmin } from "~~/server/utils/supabase";

// Read surface for the governance trail. Pre-0004 databases lack actor_ip
// — select it tolerantly (missing column degrades to null, never 500).
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event);

    const query = getQuery(event);
    const limit = Math.min(MAX_LIMIT, Math.max(1, Number(query.limit) || DEFAULT_LIMIT));
    const offset = Math.max(0, Number(query.offset) || 0);

    const { getServiceSupabase } = await import("~~/server/utils/supabase");
    const admin = getServiceSupabase();

    let rows: any[] | null = null;
    let total = 0;
    const full = await admin
      .from("admin_audit_log")
      .select("*, actor_ip", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (full.error && String(full.error.message || "").includes("actor_ip")) {
      const legacy = await admin
        .from("admin_audit_log")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      if (legacy.error) throw legacy.error;
      rows = legacy.data;
      total = legacy.count ?? 0;
    } else {
      if (full.error) throw full.error;
      rows = full.data;
      total = full.count ?? 0;
    }

    return {
      entries: (rows || []).map((r: any) => ({
        id: r.id,
        actorEmail: r.actor_email,
        action: r.action,
        target: r.target_email,
        actorIp: r.actor_ip ?? null,
        createdAt: r.created_at,
      })),
      pagination: { total, limit, offset },
    };
  } catch (error: any) {
    console.error("Admin audit fetch error:", error?.message || error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch audit log",
    });
  }
});
