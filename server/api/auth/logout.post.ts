import { defineApi } from "~~/server/utils/api";
import { getSupabase } from "~~/server/utils/supabase";

// POST /api/auth/logout — sign out THIS device only. ("global" would also
// end the customer's sessions on every other phone/laptop.) Admin demotion
// still revokes everything server-side via auth.admin.signOut.
export default defineApi(async (event) => {
  const { error } = await getSupabase(event).auth.signOut({ scope: "local" });
  if (error && !/session/i.test(error.message)) throw error;
  return { success: true };
});
