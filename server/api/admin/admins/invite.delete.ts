import { z } from "zod";
import { getServiceSupabase } from "~~/server/utils/supabase";
import { isRateLimited } from "~~/server/utils/rateLimit";
import { getClientIp } from "~~/server/utils/clientIp";
import { auditAdminAction, requireOwner } from "~~/server/utils/adminGovernance";

// Owner-only: revoke a pending admin invite before it is consumed.
// A mistyped invite must not linger until that address signs up.
const revokeSchema = z.object({ email: z.string().email() });

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireOwner(event);
    const ip = getClientIp(event);
    const { limited } = isRateLimited(`admin-invite-revoke:${ip}`, { limit: 20, windowSecs: 3600 });
    if (limited) {
      throw createError({ statusCode: 429, statusMessage: "Too many attempts. Try again later." });
    }
    const body = await readValidatedBody(event, revokeSchema.parse);
    const email = body.email.trim().toLowerCase();

    const { data, error } = await getServiceSupabase()
      .from("admin_invites")
      .delete()
      .eq("email", email)
      .select("email");
    if (error) throw error;
    if (!data || data.length === 0) {
      throw createError({ statusCode: 404, statusMessage: "No pending invite for this email." });
    }
    await auditAdminAction(user.email, "invite_revoked", email, ip);
    return { success: true };
  } catch (error: any) {
    console.error("Admin invite revoke error:", error?.message || error);
    if (error instanceof z.ZodError) {
      throw createError({ statusCode: 400, statusMessage: "Invalid email." });
    }
    if (error?.statusCode) throw error;
    throw createError({ statusCode: 500, statusMessage: "Failed to revoke invite." });
  }
});
