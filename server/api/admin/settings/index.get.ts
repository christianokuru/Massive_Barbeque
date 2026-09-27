import { requireAdmin } from "~~/server/utils/supabase";
import { getDeliveryFee } from "~~/server/utils/siteSettings";

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event);
    return { deliveryFee: await getDeliveryFee() };
  } catch (error: any) {
    console.error("Admin settings fetch error:", error?.message || error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch settings",
    });
  }
});
