import { getDeliveryFee } from "~~/server/utils/siteSettings";

// Public storefront value: the delivery fee checkout displays.
// Single safe row — nothing else in admin_settings is exposed.
export default defineEventHandler(async () => {
  try {
    return { deliveryFee: await getDeliveryFee() };
  } catch {
    const { DELIVERY_FEE_FLAT } = await import("~~/shared/utils/pricing");
    return { deliveryFee: DELIVERY_FEE_FLAT };
  }
});
