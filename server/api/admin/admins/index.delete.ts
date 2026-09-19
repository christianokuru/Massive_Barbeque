import { z } from "zod";
import { getServiceSupabase } from "~~/server/utils/supabase";
import { isRateLimited } from "~~/server/utils/rateLimit";
import { getClientIp } from "~~/server/utils/clientIp";
import {
  auditAdminAction,
  findUserIdByEmail,
  ownerEmails,
  requireOwner,
  stripAdminRole,
} from "~~/server/utils/adminGovernance";

// Owner-only: demote an admin. Sticky in reverse — explicit only.
// Owners can never be demoted here (env-managed). Sessions are revoked
// on demote so the old JWT stops working immediately.
const demoteSchema = z.object({ email: z.string().email() });

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireOwner(event);
    const ip = getClientIp(event);
    const { limited } = isRateLimited(`admin-demote:${ip}`, { limit: 20, windowSecs: 3600 });
    if (limited) {
      throw createError({ statusCode: 429, statusMessage: "Too many attempts. Try again later." });
    }
    const body = await readValidatedBody(event, demoteSchema.parse);
    const email = body.email.trim().toLowerCase();
    const config = useRuntimeConfig();

    if (email === (user.email || "").toLowerCase()) {
      throw createError({ statusCode: 400, statusMessage: "You cannot demote yourself." });
    }
    if (ownerEmails(config).includes(email)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Owners are managed via env and cannot be demoted here.",
      });
    }

    const userId = await findUserIdByEmail(email);
    if (!userId) {
      throw createError({ statusCode: 404, statusMessage: "No account found for this email." });
    }
    const ok = await stripAdminRole(userId);
    if (!ok) throw createError({ statusCode: 500, statusMessage: "Could not demote user." });
    // Revoke sessions so the demoted JWT stops working immediately
    // (requireAdmin would otherwise trust it until re-login).
    try {
      await getServiceSupabase().auth.admin.signOut(userId);
    } catch (signOutError) {
      console.error("Admin demote sign-out failed:", (signOutError as any)?.message || signOutError);
    }
    await auditAdminAction(user.email, "demote", email, ip);
    return { success: true };
  } catch (error: any) {
    console.error("Admin demote error:", error?.message || error);
    if (error instanceof z.ZodError) {
      throw createError({ statusCode: 400, statusMessage: "Invalid email." });
    }
    if (error?.statusCode) throw error;
    throw createError({ statusCode: 500, statusMessage: "Failed to demote user." });
  }
});
