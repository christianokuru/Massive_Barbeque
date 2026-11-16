import { defineApi, enforceRateLimit, parseBody, apiError } from "~~/server/utils/api";
import { requireUser } from "~~/server/utils/supabase";
import { addressSchema, createAddress, countAddresses, MAX_ADDRESSES } from "~~/server/utils/addressbook";

// POST /api/addresses — save a new address for ME (first one becomes default).
export default defineApi(async (event) => {
  enforceRateLimit(event, "addresses", { limit: 30, windowSecs: 3600 });
  const { supabase, user } = await requireUser(event);
  const body = await parseBody(event, addressSchema);
  if ((await countAddresses(supabase, user.id)) >= MAX_ADDRESSES) {
    apiError(400, `You can save up to ${MAX_ADDRESSES} addresses. Remove one first.`);
  }
  return { success: true, address: await createAddress(supabase, user.id, body) };
});
