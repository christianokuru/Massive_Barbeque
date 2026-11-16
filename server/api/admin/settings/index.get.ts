import { defineApi } from "~~/server/utils/api";
import { requireAdmin } from "~~/server/utils/supabase";
import { getDeliveryFee } from "~~/server/utils/siteSettings";

// GET /api/admin/settings — current store settings.
export default defineApi(async (event) => {
  await requireAdmin(event);
  return { deliveryFee: await getDeliveryFee() };
});
