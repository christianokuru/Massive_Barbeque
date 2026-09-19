import { z } from "zod";
import { getSupabase, getServiceSupabase } from "~~/server/utils/supabase";
import { isRateLimited } from "~~/server/utils/rateLimit";
import { getClientIp } from "~~/server/utils/clientIp";
import { ensureAdminRole } from "~~/server/utils/adminBootstrap";
import { claimGuestOrders } from "~~/server/utils/orderClaim";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  // Staff door (`/admin/login`) sends `portal: "admin"` for a tighter
  // throttle, generic errors, and an admin-only gate below.
  portal: z.literal("admin").optional(),
});

export default defineEventHandler(async (event) => {
  try {
    // Brute-force protection: 10 attempts per IP+email per 15 minutes.
    // Composite key: one IP can't spray many accounts, and one account
    // can't be sprayed from many IPs without bound. Shapes (404 unknown
    // vs 401 wrong password) are an intentional product decision.
    const preBody = await readBody(event).catch(() => ({}));
    const rateEmail = String((preBody as any)?.email || "").toLowerCase().slice(0, 254);
    const adminPortal = (preBody as any)?.portal === "admin";
    const ip = getClientIp(event);
    // Staff door gets its own bucket: 5 attempts per IP+email per hour.
    // Separate key so customer-login traffic can't eat the admin budget.
    const bucket = adminPortal
      ? { key: `admin-login:${ip}:${rateEmail}`, limit: 5, windowSecs: 3600 }
      : { key: `login:${ip}:${rateEmail}`, limit: 10, windowSecs: 900 };
    const { limited, retryAfterSecs } = isRateLimited(bucket.key, {
      limit: bucket.limit,
      windowSecs: bucket.windowSecs,
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
    // by the composite rate limit above (10 attempts/IP+email/15min).
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
      // Staff door never confirms account existence — one generic answer
      // for unknown email, wrong password, and non-admin alike.
      if (adminPortal) {
        throw createError({ statusCode: 401, statusMessage: "Invalid email or password." });
      }
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

    if (adminPortal) {
      // Staff-door gate: re-read the user — ensureAdminRole may have just
      // stamped the role, so the sign-in response can be stale. Non-staff
      // credentials get the session revoked immediately so this endpoint
      // never leaves a customer logged in, and the same generic 401 as
      // every other staff-door failure (never reveal role or existence).
      const { data: fresh } = await admin.auth.admin.getUserById(data.user.id);
      if ((fresh?.user as any)?.app_metadata?.role !== "admin") {
        await supabase.auth.signOut().catch(() => {});
        throw createError({ statusCode: 401, statusMessage: "Invalid email or password." });
      }
    }

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
