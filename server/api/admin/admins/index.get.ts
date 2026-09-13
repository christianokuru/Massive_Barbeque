import { getServiceSupabase } from "~~/server/utils/supabase";
import { ownerEmails, requireOwner } from "~~/server/utils/adminGovernance";

// Owner-only: roster of current admins + pending invites.
export default defineEventHandler(async (event) => {
  try {
    await requireOwner(event);
    const config = useRuntimeConfig();
    const owners = ownerEmails(config);
    const admin = getServiceSupabase();

    const admins: Array<{ id: string; email: string; lastSignIn: string | null; isOwner: boolean }> = [];
    for (let page = 1; page <= 10; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw error;
      for (const u of data.users || []) {
        if ((u.app_metadata as any)?.role === "admin" && u.email) {
          admins.push({
            id: u.id,
            email: u.email,
            lastSignIn: u.last_sign_in_at ?? null,
            isOwner: owners.includes(u.email.toLowerCase()),
          });
        }
      }
      if ((data.users || []).length < 1000) break;
    }

    const { data: invites } = await admin
      .from("admin_invites")
      .select("email, invited_by_email, created_at")
      .order("created_at", { ascending: false });

    return { admins, invites: invites ?? [] };
  } catch (error: any) {
    console.error("Admin roster error:", error?.message || error);
    if (error?.statusCode) throw error;
    throw createError({ statusCode: 500, statusMessage: "Failed to load admins." });
  }
});
