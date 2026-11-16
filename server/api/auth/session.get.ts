import { getAuthUser } from "~~/server/utils/supabase";
import { isOwnerEmail, ownerEmails } from "~~/server/utils/adminGovernance";

// GET /api/auth/session → { user, isOwner }. Never throws: any problem
// reads as signed out. Ownership requires a CONFIRMED email.
export default defineEventHandler(async (event) => {
  try {
    const { user } = await getAuthUser(event);
    const isOwner =
      !!user && !!(user as any).email_confirmed_at && isOwnerEmail(user.email, ownerEmails());
    return { user, isOwner };
  } catch {
    return { user: null, isOwner: false };
  }
});
