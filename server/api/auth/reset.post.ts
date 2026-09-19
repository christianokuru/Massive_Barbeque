import { z } from "zod";
import { isRateLimited } from "~~/server/utils/rateLimit";
import { getClientIp } from "~~/server/utils/clientIp";
import { getServiceSupabase } from "~~/server/utils/supabase";

// Password-reset requests go through here (not directly from the
// browser) so they are throttled and the redirect target is fixed to
// the canonical app URL — a poisoned Origin can't steal recovery links.
const resetSchema = z.object({ email: z.string().email().max(254) });

export default defineEventHandler(async (event) => {
  try {
    const ip = getClientIp(event);
    // OTP/email sends cost money per attempt: 5 per IP+email per hour.
    const preBody = await readBody(event).catch(() => ({}));
    const rateEmail = String((preBody as any)?.email || "").toLowerCase().slice(0, 254);
    const { limited, retryAfterSecs } = isRateLimited(`reset:${ip}:${rateEmail}`, {
      limit: 5,
      windowSecs: 3600,
    });
    if (limited) {
      setResponseHeader(event, "Retry-After", String(retryAfterSecs));
      throw createError({
        statusCode: 429,
        statusMessage: "Too many reset requests. Try again later.",
      });
    }

    const body = await readValidatedBody(event, resetSchema.parse);
    const config = useRuntimeConfig(event);
    const redirectTo = `${config.public.appUrl}/reset-password`;

    // Always respond success (even for unknown emails) — no enumeration.
    const admin = getServiceSupabase();
    await admin.auth.resetPasswordForEmail(body.email, { redirectTo }).catch((e: any) => {
      console.error("Password reset error:", e?.message || e);
    });
    return { success: true };
  } catch (error: any) {
    console.error("Password reset error:", error?.message || error);
    if (error instanceof z.ZodError) {
      throw createError({ statusCode: 400, statusMessage: "Enter a valid email." });
    }
    if (error?.statusCode) throw error;
    throw createError({ statusCode: 500, statusMessage: "Could not send reset email." });
  }
});
