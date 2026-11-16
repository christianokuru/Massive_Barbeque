import { getDeliveryFee } from "~~/server/utils/siteSettings";

// GET /api/settings/public → { deliveryFee } — the one setting the
// storefront needs. Never fails: getDeliveryFee falls back to the default.
export default defineEventHandler(async () => ({ deliveryFee: await getDeliveryFee() }));
