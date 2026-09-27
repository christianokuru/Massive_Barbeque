import { z } from "zod";
import { getServiceSupabase } from "~~/server/utils/supabase";
import { DELIVERY_FEE_FLAT } from "~~/shared/utils/pricing";

// Ops settings with an in-memory cache (60s). Every reader falls back to
// the code constant on any failure — the storefront never breaks because
// a settings row is missing or malformed.

export const settingsSchema = z.object({
  deliveryFee: z.number().finite().min(0).max(100000),
});

export type SettingsInput = z.infer<typeof settingsSchema>;

let deliveryFeeCache: { value: number; at: number } | null = null;
const CACHE_MS = 60_000;

function sanitizeFee(raw: unknown): number | null {
  const n = typeof raw === "number" ? raw : Number((raw as any)?.naira ?? raw);
  return Number.isFinite(n) && n >= 0 && n <= 100000 ? n : null;
}

/** Current delivery fee in Naira (cached; falls back to the constant). */
export async function getDeliveryFee(): Promise<number> {
  if (deliveryFeeCache && Date.now() - deliveryFeeCache.at < CACHE_MS) {
    return deliveryFeeCache.value;
  }
  try {
    const { data, error } = await getServiceSupabase()
      .from("admin_settings")
      .select("value")
      .eq("key", "delivery_fee")
      .maybeSingle();
    if (error) throw error;
    const fee = sanitizeFee((data as any)?.value);
    deliveryFeeCache = { value: fee ?? DELIVERY_FEE_FLAT, at: Date.now() };
    return deliveryFeeCache.value;
  } catch {
    return DELIVERY_FEE_FLAT;
  }
}

/** Persist the delivery fee (admin API validates first). */
export async function setDeliveryFee(naira: number): Promise<void> {
  await getServiceSupabase()
    .from("admin_settings")
    .upsert(
      { key: "delivery_fee", value: { naira }, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    )
    .throwOnError();
  deliveryFeeCache = { value: naira, at: Date.now() };
}
