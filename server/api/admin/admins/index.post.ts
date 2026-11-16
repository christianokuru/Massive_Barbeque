import { z } from "zod";
import { apiError, defineApi, enforceRateLimit, parseBody } from "~~/server/utils/api";
import { db, must } from "~~/server/utils/db";
import { getClientIp } from "~~/server/utils/clientIp";
import { auditAdminAction, findUserIdByEmail, ownerEmails, requireOwner, stampAdminRole } from "~~/server/utils/adminGovernance";

// POST /api/admin/admins — owner-only: make an email an admin. An existing
// account is promoted now; an unknown email gets an invite that applies on
// signup (verified email only — see adminBootstrap).
const schema = z.object({ email: z.string().trim().toLowerCase().email("Enter a valid email.").max(254) });

export default defineApi(async (event) => {
  const { user } = await requireOwner(event);
  enforceRateLimit(event, "admin-promote", { limit: 20, windowSecs: 3600 });
  const { email } = await parseBody(event, schema);
  const ip = getClientIp(event);
  if (ownerEmails().includes(email)) apiError(400, "That email is an owner (managed in server settings).");

  const userId = await findUserIdByEmail(email);
  if (userId) {
    await auditAdminAction(user.email || null, "promote", email, ip);
    if (!(await stampAdminRole(userId))) apiError(500, "Could not promote user.");
    return { success: true, mode: "promoted" };
  }

  await auditAdminAction(user.email || null, "invite", email, ip);
  must(await db().from("admin_invites").upsert({ email, invited_by_email: user.email }, { onConflict: "email" }));
  return { success: true, mode: "invited" };
});
