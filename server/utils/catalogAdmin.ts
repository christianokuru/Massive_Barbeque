import { z } from "zod";
import { apiError } from "~~/server/utils/api";
import { db, must } from "~~/server/utils/db";
import { imageUrlSchema } from "~~/server/utils/productImages";

/*
 * Shared rules for admin catalog writes (categories, products, variants).
 * Prices are decimal strings ("7000" / "7000.50") to match Postgres
 * numeric columns; a price must be above zero so nothing sells for free.
 */

const PRICE_RE = /^\d{1,8}(\.\d{1,2})?$/;
export const priceSchema = z
  .string()
  .trim()
  .regex(PRICE_RE, "Enter a price like 7000 or 7000.50.")
  .refine((v) => Number(v) > 0, "Price must be more than zero.");
export const optionalDecimal = z.string().trim().regex(PRICE_RE, "Enter a number like 1.5.");

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug can only use letters, numbers and dashes.");

export const variantInputSchema = z.object({
  name: z.string().trim().min(1, "Variant name is required").max(200),
  sku: z.string().trim().min(1, "SKU is required").max(100),
  price: priceSchema,
  comparePrice: optionalDecimal.nullish(),
  inventoryQty: z.number().int().min(0).max(1000000).default(0),
  weight: optionalDecimal.nullish(),
  isActive: z.boolean().default(true),
});



/** 400 unless the category exists (null = uncategorised, allowed). */
export async function assertCategoryExists(id: number | null | undefined): Promise<void> {
  if (id == null) return;
  const row = must(await db().from("categories").select("id").eq("id", id).maybeSingle());
  if (!row) apiError(400, "That category doesn't exist.");
}

/** Map a unique-constraint failure to a friendly 409, rethrow anything else. */
export function conflictAs(error: any, message: string): never {
  if (error?.code === "23505") apiError(409, message);
  throw error;
}
