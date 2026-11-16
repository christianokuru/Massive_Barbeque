import { z } from "zod";
import { defineApi, enforceRateLimit, parseBody } from "~~/server/utils/api";
import { db, must } from "~~/server/utils/db";

// POST /api/cart/quote { variantIds: number[] }
// → { lines: [{ variantId, available, price, productId, productName, variantName, sku, imageUrl }] }
//
// The cart lives in the browser and keeps a copy of names and prices from
// when an item was added. This returns today's catalog values so the cart
// and checkout show what the buyer will really pay, and flags sizes that
// were removed. Read-only and public (same data as /api/products).
const schema = z.object({
  variantIds: z.array(z.number().int().positive()).min(1).max(50),
});

export default defineApi(async (event) => {
  enforceRateLimit(event, "cart-quote", { limit: 300, windowSecs: 900, message: "Too many requests. Try again shortly." });
  const { variantIds } = await parseBody(event, schema);
  const ids = [...new Set(variantIds)];

  const rows = must(
    await db()
      .from("product_variants")
      .select("id, name, sku, price, is_active, products!inner(id, name, image_url, is_active)")
      .in("id", ids),
  ) as any[];
  const byId = new Map(rows.map((r) => [r.id, r]));

  return {
    lines: ids.map((id) => {
      const v = byId.get(id);
      const available = !!v && v.is_active !== false && v.products?.is_active !== false;
      if (!available) return { variantId: id, available: false };
      return {
        variantId: id,
        available: true,
        price: Number(v.price),
        productId: v.products.id,
        productName: v.products.name,
        variantName: v.name,
        sku: v.sku,
        imageUrl: v.products.image_url ?? null,
      };
    }),
  };
});
