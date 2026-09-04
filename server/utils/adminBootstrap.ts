import { getServiceSupabase } from "~~/server/utils/supabase";

// Promotes the user to admin when their email is listed in ADMIN_EMAILS
// (comma-separated server env). This is the bootstrap mechanism for the
// very first admin — there is no self-promotion path in the app.
// Role is stored in app_metadata (not user_metadata) so clients can't
// escalate themselves; RLS and requireAdmin read it from the JWT.
export async function ensureAdminRole(userId: string, email: string): Promise<boolean> {
  const config = useRuntimeConfig();
  const allowList = String(config.adminEmails || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!allowList.includes(email.trim().toLowerCase())) return false;

  const admin = getServiceSupabase();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data?.user) return false;
  if ((data.user.app_metadata as any)?.role === "admin") return true;

  const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { ...(data.user.app_metadata || {}), role: "admin" },
  });
  return !updateError;
}
