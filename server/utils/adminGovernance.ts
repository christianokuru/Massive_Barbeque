import { getServiceSupabase, requireUser } from "~~/server/utils/supabase";

// Explicit admin governance. Rules:
// - Admins stay admins until an owner demotes them (sticky by default).
// - Only owners manage admins. Owners come from OWNER_EMAILS; when it is
//   empty, ADMIN_EMAILS act as owners (bootstrap fallback, documented).
// - Owners themselves can only be added/removed via env (never via UI),
//   so a compromised admin account cannot seize ownership.

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

/** Pure and unit-tested: is this email an owner? */
export function isOwnerEmail(email: unknown, owners: string[], adminsFallback: string[]): boolean {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) return false;
  if (owners.includes(normalized)) return true;
  // Bootstrap fallback while OWNER_EMAILS is unset.
  if (owners.length === 0 && adminsFallback.includes(normalized)) return true;
  return false;
}

export async function requireOwner(event: any) {
  const { user } = await requireUser(event);
  const config = useRuntimeConfig();
  if (!isOwnerEmail(user.email, ownerEmails(config), adminAllowEmails(config))) {
    throw createError({ statusCode: 403, statusMessage: "Forbidden: owner only" });
  }
  return { user };
}

export async function auditAdminAction(
  actorEmail: string | null,
  action: "promote" | "demote" | "invite" | "invite_consumed",
  targetEmail: string
): Promise<void> {
  try {
    await getServiceSupabase().from("admin_audit_log").insert({
      actor_email: actorEmail,
      action,
      target_email: targetEmail.toLowerCase(),
    });
  } catch (error) {
    // Auditing must never break the action itself — log and continue.
    console.error("Admin audit write failed:", (error as any)?.message || error);
  }
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
