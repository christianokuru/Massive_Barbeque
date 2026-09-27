import { z } from "zod";
import { requireAdmin } from "~~/server/utils/supabase";
import { settingsSchema, setDeliveryFee } from "~~/server/utils/siteSettings";
import { auditAdminAction } from "~~/server/utils/adminGovernance";
import { getClientIp } from "~~/server/utils/clientIp";
import { isRateLimited } from "~~/server/utils/rateLimit";

const bodySchema = settingsSchema;

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireAdmin(event);
    const ip = getClientIp(event);
    const { limited } = isRateLimited(`admin-settings:${ip}`, { limit: 20, windowSecs: 3600 });
    if (limited) {
      throw createError({ statusCode: 429, statusMessage: "Too many attempts. Try again later." });
    }

    const body = await readValidatedBody(event, bodySchema.parse);
    // Round to whole Naira — kobo fees are a display and gateway edge.
    const naira = Math.round(body.deliveryFee);
    await setDeliveryFee(naira);
    await auditAdminAction(user.email || null, "settings_change", "delivery_fee", ip);

    return { success: true, deliveryFee: naira };
  } catch (error: any) {
    console.error("Admin settings update error:", error?.message || error);

    if (error instanceof z.ZodError) {
      throw createError({ statusCode: 400, statusMessage: "Invalid form data", data: error.errors });
    }
    if (error?.statusCode) throw error;

    throw createError({ statusCode: 500, statusMessage: "Failed to update settings" });
  }
});
