import { getServiceSupabase } from "~~/server/utils/supabase";

// Sitemap product source, prerendered at build time
// (nuxt.config `sitemap.sources` + `nitro.prerender.routes`).
// Fail-soft by design: a DB blip returns [] so the build never breaks —
// the sitemap just ships without product URLs that run.
export default defineEventHandler(async () => {
  try {
    const admin = getServiceSupabase();
    const { data, error } = await admin
      .from("products")
      .select("id")
      .eq("is_active", true)
      .limit(500);
    if (error || !data) return [];
    return data.map((p: any) => ({
      loc: `/product/${p.id}`,
      changefreq: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    return [];
  }
});
