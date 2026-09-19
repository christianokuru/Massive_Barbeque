import { z } from "zod";
import { getServiceSupabase } from "~~/server/utils/supabase";
import { isRateLimited } from "~~/server/utils/rateLimit";
import { getClientIp } from "~~/server/utils/clientIp";
import {
  auditAdminAction,
  findUserIdByEmail,
  ownerEmails,
  requireOwner,
  stampAdminRole,
} from "~~/server/utils/adminGovernance";

// Owner-only: promote an email to admin. If the account exists it is
// stamped immediately; otherwise a pending invite auto-stamps on signup.
const promoteSchema = z.object({ email: z.string().email() });

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireOwner(event);
    const ip = getClientIp(event);
    const { limited } = isRateLimited(`admin-promote:${ip}`, { limit: 20, windowSecs: 3600 });
    if (limited) {
      throw createError({ statusCode: 429, statusMessage: "Too many attempts. Try again later." });
    }
    const body = await readValidatedBody(event, promoteSchema.parse);
    const email = body.email.trim().toLowerCase();
    const config = useRuntimeConfig();
    if (ownerEmails(config).includes(email)) {
      throw createError({ statusCode: 400, statusMessage: "That email is an owner (managed via env)." });
    }

    const userId = await findUserIdByEmail(email);
    if (userId) {
      const ok = await stampAdminRole(userId);
      if (!ok) throw createError({ statusCode: 500, statusMessage: "Could not promote user." });
      await auditAdminAction(user.email, "promote", email, ip);
      return { success: true, mode: "promoted" };
    }

    const { error } = await getServiceSupabase()
      .from("admin_invites")
      .upsert({ email, invited_by_email: user.email }, { onConflict: "email" });
    if (error) throw error;
    await auditAdminAction(user.email, "invite", email, ip);
    return { success: true, mode: "invited" };
  } catch (error: any) {
    console.error("Admin promote error:", error?.message || error);
    if (error instanceof z.ZodError) {
      throw createError({ statusCode: 400, statusMessage: "Invalid email." });
    }
    if (error?.statusCode) throw error;
    throw createError({ statusCode: 500, statusMessage: "Failed to promote user." });
  }
});
