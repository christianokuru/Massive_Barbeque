import { z } from "zod";
import { apiError, defineApi, enforceRateLimit, parseBody } from "~~/server/utils/api";
import { db, must } from "~~/server/utils/db";
import { getClientIp } from "~~/server/utils/clientIp";
import { auditAdminAction, requireOwner } from "~~/server/utils/adminGovernance";

// DELETE /api/admin/admins/invite — owner-only: revoke a pending invite.
const schema = z.object({ email: z.string().trim().toLowerCase().email("Enter a valid email.").max(254) });

export default defineApi(async (event) => {
  const { user } = await requireOwner(event);
  enforceRateLimit(event, "admin-invite-revoke", { limit: 20, windowSecs: 3600 });
  const { email } = await parseBody(event, schema);

  const existing = must(await db().from("admin_invites").select("email").eq("email", email).maybeSingle());
  if (!existing) apiError(404, "No pending invite for this email.");
  await auditAdminAction(user.email || null, "invite_revoked", email, getClientIp(event));
  must(await db().from("admin_invites").delete().eq("email", email));
  return { success: true };
});
