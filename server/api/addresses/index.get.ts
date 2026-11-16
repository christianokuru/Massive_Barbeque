import { defineApi } from "~~/server/utils/api";
import { requireUser } from "~~/server/utils/supabase";
import { listAddresses } from "~~/server/utils/addressbook";

// GET /api/addresses — MY saved addresses (default first). User-scoped
// client: RLS applies on top of the explicit user_id scoping.
export default defineApi(async (event) => {
  const { supabase, user } = await requireUser(event);
  return { addresses: await listAddresses(supabase, user.id) };
});
