import { getAuthUser } from "~~/server/utils/supabase";
import { adminAllowEmails, isOwnerEmail, ownerEmails } from "~~/server/utils/adminGovernance";

export default defineEventHandler(async (event) => {
  try {
    const { user } = await getAuthUser(event);
    const config = useRuntimeConfig();
    const isOwner =
      !!user &&
      isOwnerEmail(user.email, ownerEmails(config), adminAllowEmails(config));
    return { user, isOwner };
  } catch {
    return { user: null, isOwner: false };
  }
});
