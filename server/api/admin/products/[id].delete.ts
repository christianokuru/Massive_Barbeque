import { requireAdmin } from "~~/server/utils/supabase";

export default defineEventHandler(async (event) => {
  const { supabase } = await requireAdmin(event);

  const id = Number(getRouterParam(event, "id"));
  if (!id) throw createError({ statusCode: 400, statusMessage: "Product ID required" });

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
  return { success: true };
});
