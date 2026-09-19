import { z } from "zod";

// Extra gallery photos per product (cover excluded — that stays
// products.image_url). Bounds payload size and storage growth.
export const MAX_EXTRA_IMAGES = 8;

// Allowed image locations for products (cover + extras):
// - https://… absolute URLs (Supabase public bucket URLs land here)
// - /… site-relative paths (seeded /images/Food/… photos)
// Anything else (javascript:, data:, protocol-relative //, backslashes,
// whitespace) is rejected — a stored `javascript:` URL becomes XSS the
// moment any link/preview renders it as href.
export function isAllowedImageUrl(v: string): boolean {
  if (typeof v !== "string" || v.length === 0 || v.length > 2048) return false;
  if (/[\s\\]/.test(v)) return false;
  if (v.startsWith("https://")) return true;
  if (v.startsWith("/") && !v.startsWith("//")) return true;
  return false;
}

export const imageUrlSchema = z
  .string()
  .max(2048)
  .refine(isAllowedImageUrl, {
    message: "Must be an https URL or a site path like /images/…",
  });
