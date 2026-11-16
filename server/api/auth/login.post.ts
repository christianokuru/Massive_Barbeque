import { z } from "zod";
import { apiError, defineApi, enforceRateLimit, parseBody } from "~~/server/utils/api";
import { getSupabase } from "~~/server/utils/supabase";
import { db } from "~~/server/utils/db";
import { ensureAdminRole } from "~~/server/utils/adminBootstrap";
import { findUserIdByEmail } from "~~/server/utils/adminGovernance";
import { claimGuestOrders } from "~~/server/utils/orderClaim";

// POST /api/auth/login { email, password, portal? }
//
// Customer door: unknown email → 404 "No account…", wrong password → 401
// (account existence is enumerable by product decision; throttled).
// Staff door (portal: "admin"): one generic 401 for every failure, a
// tighter throttle, and non-admins are signed straight back out.
const schema = z.object({
  email: z.string({ required_error: "Enter your email address." }).trim().toLowerCase().email("Enter a valid email address.").max(254),
  password: z.string({ required_error: "Enter your password." }).min(1, "Enter your password.").max(200),
  portal: z.literal("admin").optional(),
});

const GENERIC = "Invalid email or password.";

export default defineApi(async (event) => {
  // Pick the throttle from the raw body BEFORE validation, so malformed
  // spam is counted too. Staff door: 5/hour; customers: 10/15 min — both
  // per client + email.
  const raw = ((await readBody(event).catch(() => ({}))) || {}) as Record<string, unknown>;
  const staffDoor = raw.portal === "admin";
  enforceRateLimit(event, staffDoor ? "admin-login" : "login", {
    limit: staffDoor ? 5 : 10,
    windowSecs: staffDoor ? 3600 : 900,
    key: String(raw.email ?? "").trim().toLowerCase().slice(0, 254),
    message: "Too many login attempts. Try again later.",
  });
  const body = await parseBody(event, schema);

  const supabase = getSupabase(event);
  const { data, error } = await supabase.auth.signInWithPassword({ email: body.email, password: body.password });

  if (error || !data.user) {
    if (staffDoor) apiError(401, GENERIC);
    if ((error as any)?.code === "email_not_confirmed") {
      apiError(403, "Please confirm your email first - check your inbox for the link.");
    }
    // Only on failure do we pay for the existence lookup.
    let exists = true;
    try {
      exists = !!(await findUserIdByEmail(body.email));
    } catch {
      exists = true; // lookup trouble → never claim "no account"
    }
    if (!exists) apiError(404, "No account found for this email. Create one to continue.");
    apiError(401, GENERIC);
  }

  // Bootstrap: allow-listed / invited (verified) emails become admin.
  await ensureAdminRole(data.user.id, data.user.email || body.email);

  if (staffDoor) {
    // Re-read: ensureAdminRole may have just stamped the role, so the
    // sign-in response can be stale. Non-staff never stay signed in here.
    const { data: fresh } = await db().auth.admin.getUserById(data.user.id);
    if ((fresh?.user as any)?.app_metadata?.role !== "admin") {
      await supabase.auth.signOut({ scope: "local" }).catch(() => {});
      apiError(401, GENERIC);
    }
  }

  // Attach earlier guest orders (confirmed emails only — see orderClaim).
  await claimGuestOrders(data.user);
  return { success: true, user: data.user };
});
