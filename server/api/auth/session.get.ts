import { getAuthUser } from "~~/server/utils/supabase";
import { isOwnerEmail, ownerEmails } from "~~/server/utils/adminGovernance";

export default defineEventHandler(async (event) => {
  try {
    const { user } = await getAuthUser(event);
    const config = useRuntimeConfig();
    // Ownership requires a confirmed email — never trust an unverified
    // address claiming an owner email.
    const isOwner =
      !!user &&
      !!(user as any)?.email_confirmed_at &&
      isOwnerEmail(user.email, ownerEmails(config));
    return { user, isOwner };
  } catch {
    return { user: null, isOwner: false };
  }
});
