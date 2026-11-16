import { defineApi, enforceRateLimit, parseBody } from "~~/server/utils/api";
import { requireAdmin } from "~~/server/utils/supabase";
import { settingsSchema, setDeliveryFee } from "~~/server/utils/siteSettings";
import { auditAdminAction } from "~~/server/utils/adminGovernance";
import { getClientIp } from "~~/server/utils/clientIp";

// PUT /api/admin/settings — change the delivery fee (whole Naira).
// Audited before the write (fail-closed).
export default defineApi(async (event) => {
  const { user } = await requireAdmin(event);
  enforceRateLimit(event, "admin-settings", { limit: 20, windowSecs: 3600 });
  const body = await parseBody(event, settingsSchema);
  const naira = Math.round(body.deliveryFee);
  await auditAdminAction(user.email || null, "settings_change", `delivery_fee:${naira}`, getClientIp(event));
  await setDeliveryFee(naira);
  return { success: true, deliveryFee: naira };
});
