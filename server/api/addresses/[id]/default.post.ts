import { defineApi, enforceRateLimit, routeId, apiError } from "~~/server/utils/api";
import { requireUser } from "~~/server/utils/supabase";
import { setDefaultAddress } from "~~/server/utils/addressbook";

// POST /api/addresses/:id/default — make one of MY addresses the default.
export default defineApi(async (event) => {
  const id = routeId(event, "id", "Address not found.");
  enforceRateLimit(event, "addresses", { limit: 30, windowSecs: 3600 });
  const { supabase, user } = await requireUser(event);
  if (!(await setDefaultAddress(supabase, user.id, id))) apiError(404, "Address not found.");
  return { success: true };
});
