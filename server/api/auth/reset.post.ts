import { z } from "zod";
import { defineApi, parseBody } from "~~/server/utils/api";
import { db } from "~~/server/utils/db";
import { throttleByEmail } from "~~/server/utils/authHelpers";

// POST /api/auth/reset { email } — send a password-reset email.
// Always answers success (never reveals whether an account exists). The
// link always returns to the canonical site, never to a request's Origin.
// Throttled: each send costs money and can be used to spam an inbox.
const schema = z.object({ email: z.string({ required_error: "Enter your email address." }).trim().toLowerCase().email("Enter a valid email.").max(254) });

export default defineApi(async (event) => {
  await throttleByEmail(event, "reset", {
    limit: 5,
    windowSecs: 3600,
    message: "Too many reset requests. Try again later.",
  });
  const body = await parseBody(event, schema);
  const redirectTo = `${String(useRuntimeConfig(event).public.appUrl).replace(/\/+$/, "")}/reset-password`;

  const { error } = await db().auth.resetPasswordForEmail(body.email, { redirectTo });
  if (error) console.error("[auth] password reset send failed:", error.message);
  return { success: true };
});
