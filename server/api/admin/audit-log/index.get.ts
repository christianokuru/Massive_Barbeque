import { defineApi, pageQuery } from "~~/server/utils/api";
import { db } from "~~/server/utils/db";
import { requireAdmin } from "~~/server/utils/supabase";

// GET /api/admin/audit-log?limit=&offset= — who did what, newest first.
export default defineApi(async (event) => {
  await requireAdmin(event);
  const { limit, offset } = pageQuery(event, { limit: 100, max: 500 });
  const { data, error, count } = await db()
    .from("admin_audit_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return {
    entries: (data || []).map((r: any) => ({
      id: r.id,
      actorEmail: r.actor_email,
      action: r.action,
      target: r.target_email,
      actorIp: r.actor_ip ?? null,
      createdAt: r.created_at,
    })),
    pagination: { total: count ?? 0, limit, offset },
  };
});
