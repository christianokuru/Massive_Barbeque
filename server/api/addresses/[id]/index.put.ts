import { defineApi, enforceRateLimit, parseBody, routeId, apiError } from "~~/server/utils/api";
import { requireUser } from "~~/server/utils/supabase";
import { addressSchema, updateAddress } from "~~/server/utils/addressbook";

// PUT /api/addresses/:id — edit one of MY saved addresses.
export default defineApi(async (event) => {
  const id = routeId(event, "id", "Address not found.");
  enforceRateLimit(event, "addresses", { limit: 30, windowSecs: 3600 });
  const { supabase, user } = await requireUser(event);
  const body = await parseBody(event, addressSchema);
  const address = await updateAddress(supabase, user.id, id, body);
  if (!address) apiError(404, "Address not found.");
  return { success: true, address };
});
