import { z } from "zod";
import { apiError, defineApi, enforceRateLimit, parseBody } from "~~/server/utils/api";
import { db } from "~~/server/utils/db";
import { getClientIp } from "~~/server/utils/clientIp";
import { auditAdminAction, findUserIdByEmail, ownerEmails, requireOwner, stripAdminRole } from "~~/server/utils/adminGovernance";

// DELETE /api/admin/admins — owner-only: demote an admin. Owners (server
// settings) and yourself can't be demoted. Sessions are revoked so the old
// admin token stops working immediately.
const schema = z.object({ email: z.string().trim().toLowerCase().email("Enter a valid email.").max(254) });

export default defineApi(async (event) => {
  const { user } = await requireOwner(event);
  enforceRateLimit(event, "admin-demote", { limit: 20, windowSecs: 3600 });
  const { email } = await parseBody(event, schema);

  if (email === (user.email || "").toLowerCase()) apiError(400, "You cannot demote yourself.");
  if (ownerEmails().includes(email)) apiError(400, "Owners are managed in server settings and cannot be demoted here.");

  const userId = await findUserIdByEmail(email);
  if (!userId) apiError(404, "No account found for this email.");

  await auditAdminAction(user.email || null, "demote", email, getClientIp(event));
  if (!(await stripAdminRole(userId))) apiError(500, "Could not demote user.");
  try {
    await db().auth.admin.signOut(userId);
  } catch (e: any) {
    console.error("Admin demote sign-out failed:", e?.message || e);
  }
  return { success: true };
});
