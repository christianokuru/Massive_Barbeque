import { defineApi } from "~~/server/utils/api";
import { db, must } from "~~/server/utils/db";
import { ownerEmails, requireOwner } from "~~/server/utils/adminGovernance";

// GET /api/admin/admins — owner-only roster: current admins + pending invites.
export default defineApi(async (event) => {
  await requireOwner(event);
  const owners = ownerEmails();

  const admins: Array<{ id: string; email: string; name: string | null; lastSignIn: string | null; isOwner: boolean }> = [];
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await db().auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    for (const u of data.users || []) {
      if ((u.app_metadata as any)?.role === "admin" && u.email) {
        admins.push({
          id: u.id,
          email: u.email,
          name: (u.user_metadata as any)?.name ?? null,
          lastSignIn: u.last_sign_in_at ?? null,
          isOwner: owners.includes(u.email.toLowerCase()),
        });
      }
    }
    if ((data.users || []).length < 1000) break;
  }
  // Owners first, then alphabetical — stable for the UI.
  admins.sort((a, b) => Number(b.isOwner) - Number(a.isOwner) || a.email.localeCompare(b.email));

  const invites = must(
    await db().from("admin_invites").select("email, invited_by_email, created_at").order("created_at", { ascending: false }),
  );
  return { admins, invites: invites ?? [] };
});
