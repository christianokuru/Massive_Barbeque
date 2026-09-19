import { getServiceSupabase, requireUser } from "~~/server/utils/supabase";

// Explicit admin governance. Rules:
// - Admins stay admins until an owner demotes them (sticky by default).
// - Only owners manage admins. Owners come from OWNER_EMAILS ONLY —
//   there is intentionally no fallback to ADMIN_EMAILS (fail closed):
//   with OWNER_EMAILS unset, nobody is an owner until it is configured.
// - Owners themselves can only be added/removed via env (never via UI),
//   so a compromised admin account cannot seize ownership.
// - Owner checks require a confirmed email: an unconfirmed address
//   claiming an owner email is never trusted.

export function parseEmailList(raw: unknown): string[] {
  return String(raw || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function ownerEmails(config = useRuntimeConfig()): string[] {
  return parseEmailList((config as any).ownerEmails);
}

export function adminAllowEmails(config = useRuntimeConfig()): string[] {
  return parseEmailList((config as any).adminEmails);
}

/** Pure and unit-tested: is this email an owner? Fail closed — no
 *  fallback to the admin allow-list. Configure OWNER_EMAILS. */
export function isOwnerEmail(email: unknown, owners: string[]): boolean {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) return false;
  return owners.includes(normalized);
}

export async function requireOwner(event: any) {
  const { user } = await requireUser(event);
  const config = useRuntimeConfig();
  // Unconfirmed emails are never trusted for ownership.
  if (!(user as any)?.email_confirmed_at) {
    throw createError({ statusCode: 403, statusMessage: "Forbidden: owner only" });
  }
  if (!isOwnerEmail(user.email, ownerEmails(config))) {
    throw createError({ statusCode: 403, statusMessage: "Forbidden: owner only" });
  }
  return { user };
}

export async function auditAdminAction(
  actorEmail: string | null,
  action: "promote" | "demote" | "invite" | "invite_consumed" | "status_change",
  targetEmail: string,
  actorIp?: string
): Promise<void> {
  // Audit integrity: retry once, then fail loud. Callers treat a throw
  // as a 500 so a silent governance action can never complete.
  // The actor_ip column ships in migration 0004; fall back to a row
  // without it so pre-migration databases keep working.
  const rows = [
    {
      actor_email: actorEmail,
      action,
      target_email: targetEmail.toLowerCase(),
      actor_ip: actorIp || null,
    },
    { actor_email: actorEmail, action, target_email: targetEmail.toLowerCase() },
  ];
  let lastError: any = null;
  for (const row of rows) {
    try {
      await getServiceSupabase().from("admin_audit_log").insert(row);
      return;
    } catch (error) {
      // First shape fails when actor_ip doesn't exist yet — fall
      // through to the legacy shape before giving up.
      lastError = error;
    }
  }
  console.error("Admin audit write failed:", (lastError as any)?.message || lastError);
  throw createError({ statusCode: 500, statusMessage: "Audit write failed." });
}

/** Stamp the admin role. Returns true when the user ends up admin. */
export async function stampAdminRole(userId: string): Promise<boolean> {
  const admin = getServiceSupabase();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data?.user) return false;
  if ((data.user.app_metadata as any)?.role === "admin") return true;
  const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { ...(data.user.app_metadata || {}), role: "admin" },
  });
  return !updateError;
}

/** Strip the admin role. Active sessions keep old JWT claims until re-login. */
export async function stripAdminRole(userId: string): Promise<boolean> {
  const admin = getServiceSupabase();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data?.user) return false;
  const appMetadata = { ...(data.user.app_metadata || {}) };
  delete (appMetadata as any).role;
  const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: appMetadata,
  });
  return !updateError;
}

/** Find an auth user id by email (paged scan; fine at this scale). */
export async function findUserIdByEmail(email: string): Promise<string | null> {
  const admin = getServiceSupabase();
  const normalized = email.trim().toLowerCase();
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return null;
    const hit = (data.users || []).find((u) => u.email?.toLowerCase() === normalized);
    if (hit) return hit.id;
    if ((data.users || []).length < 1000) return null;
  }
  return null;
}
