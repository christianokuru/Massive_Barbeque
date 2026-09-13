import { z } from "zod";
import {
  auditAdminAction,
  findUserIdByEmail,
  ownerEmails,
  requireOwner,
  stripAdminRole,
} from "~~/server/utils/adminGovernance";

// Owner-only: demote an admin. Sticky in reverse — explicit only.
// Owners can never be demoted here (env-managed). Active sessions keep
// old JWT claims until the user signs out and back in.
const demoteSchema = z.object({ email: z.string().email() });

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireOwner(event);
    const body = await readValidatedBody(event, demoteSchema.parse);
    const email = body.email.trim().toLowerCase();
    const config = useRuntimeConfig();

    if (email === (user.email || "").toLowerCase()) {
      throw createError({ statusCode: 400, statusMessage: "You cannot demote yourself." });
    }
    if (ownerEmails(config).includes(email)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Owners are managed via env and cannot be demoted here.",
      });
    }

    const userId = await findUserIdByEmail(email);
    if (!userId) {
      throw createError({ statusCode: 404, statusMessage: "No account found for this email." });
    }
    const ok = await stripAdminRole(userId);
    if (!ok) throw createError({ statusCode: 500, statusMessage: "Could not demote user." });
    await auditAdminAction(user.email, "demote", email);
    return { success: true };
  } catch (error: any) {
    console.error("Admin demote error:", error?.message || error);
    if (error instanceof z.ZodError) {
      throw createError({ statusCode: 400, statusMessage: "Invalid email." });
    }
    if (error?.statusCode) throw error;
    throw createError({ statusCode: 500, statusMessage: "Failed to demote user." });
  }
});
