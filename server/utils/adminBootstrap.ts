import { getServiceSupabase } from "~~/server/utils/supabase";
import {
  adminAllowEmails,
  auditAdminAction,
  isOwnerEmail,
  ownerEmails,
  stampAdminRole,
} from "~~/server/utils/adminGovernance";

// Promotes the user to admin when they are an owner, on the ADMIN_EMAILS
// allow-list, or holding a pending invite (consumed on first use).
// This is the bootstrap mechanism for the very first admin — there is
// no self-promotion path in the app. Role is stored in app_metadata
// (not user_metadata) so clients can't escalate themselves; RLS and
// requireAdmin read it from the JWT.
export async function ensureAdminRole(userId: string, email: string): Promise<boolean> {
  const config = useRuntimeConfig();
  const normalized = email.trim().toLowerCase();
  const owners = ownerEmails(config);
  const allowList = adminAllowEmails(config);

  const listed = isOwnerEmail(normalized, owners) || allowList.includes(normalized);
  if (!listed) {
    // Invite path: pre-approved email signing up for the first time.
    const admin = getServiceSupabase();
    const { data: invite } = await admin
      .from("admin_invites")
      .select("email")
      .eq("email", normalized)
      .maybeSingle();
    if (!invite) return false;
    const stamped = await stampAdminRole(userId);
    if (stamped) {
      await admin.from("admin_invites").delete().eq("email", normalized);
      await auditAdminAction(null, "invite_consumed", normalized);
    }
    return stamped;
  }

  return stampAdminRole(userId);
}
