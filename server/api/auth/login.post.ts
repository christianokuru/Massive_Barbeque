import { z } from "zod";
import { getSupabase, getServiceSupabase } from "~~/server/utils/supabase";
import { isRateLimited } from "~~/server/utils/rateLimit";
import { ensureAdminRole } from "~~/server/utils/adminBootstrap";
import { claimGuestOrders } from "~~/server/utils/orderClaim";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export default defineEventHandler(async (event) => {
  try {
    // Brute-force protection: 10 attempts per IP per 15 minutes.
    const ip = getRequestIP(event) || "unknown";
    const { limited, retryAfterSecs } = isRateLimited(`login:${ip}`, {
      limit: 10,
      windowSecs: 900,
    });
    if (limited) {
      setResponseHeader(event, "Retry-After", String(retryAfterSecs));
      throw createError({
        statusCode: 429,
        statusMessage: "Too many login attempts. Try again later.",
      });
    }

    const body = await readValidatedBody(event, loginSchema.parse);

    // Existence check: Supabase returns the same error for "no such user"
    // and "wrong password", so look the email up explicitly to give a
    // specific "no account" message. NOTE: this makes account existence
    // enumerable by design (product decision) — bulk probing is throttled
    // by the rate limit above (10 attempts/IP/15min).
    const admin = getServiceSupabase();
    let exists = false;
    let lookupOk = true;
    for (let page = 1; page <= 10; page++) {
      const { data, error: listError } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (listError) {
        lookupOk = false;
        break;
      }
      const users = data.users || [];
      if (users.some((u) => u.email?.toLowerCase() === body.email.toLowerCase())) {
        exists = true;
        break;
      }
      if (users.length < 1000) break;
    }
    if (!exists && lookupOk) {
      throw createError({
        statusCode: 404,
        statusMessage: "No account found for this email. Create one to continue.",
      });
    }

    const supabase = getSupabase(event);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });
    if (error || !data.user) {
      throw createError({ statusCode: 401, statusMessage: "Invalid email or password." });
    }

    // Bootstrap: promote allow-listed emails to admin on sign-in.
    await ensureAdminRole(data.user.id, data.user.email || body.email);

    // Link any guest orders that used the same email before this account
    // existed. Email ownership is proven by the successful password check above.
    await claimGuestOrders(data.user.id, data.user.email || body.email);

    // Session cookies are set on the response by the Supabase server
    // client — the browser stays logged in across SSR and client nav.
    return { success: true, user: data.user };
  } catch (error: any) {
    console.error("Login error:", error?.message || error);

    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid form data",
        data: error.errors,
      });
    }
    if (error?.statusCode) throw error;

    throw createError({
      statusCode: 500,
      statusMessage: error?.message || "Internal Server Error",
    });
  }
});
