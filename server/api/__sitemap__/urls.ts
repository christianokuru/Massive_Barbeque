import { db } from "~~/server/utils/db";

// Sitemap product URLs (prerendered at build time — see nuxt.config).
// Fail-soft on purpose: a database blip ships a sitemap without product
// URLs rather than breaking the build.
export default defineEventHandler(async () => {
  try {
    const { data, error } = await db().from("products").select("id").eq("is_active", true).limit(500);
    if (error || !data) return [];
    return data.map((p: any) => ({ loc: `/product/${p.id}`, changefreq: "weekly" as const, priority: 0.8 }));
  } catch {
    return [];
  }
});
