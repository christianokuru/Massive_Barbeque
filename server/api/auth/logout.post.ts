import { getSupabase } from "~~/server/utils/supabase";

export default defineEventHandler(async (event) => {
  try {
    const supabase = getSupabase(event);
    await supabase.auth.signOut();
    return { success: true };
  } catch (error: any) {
    console.error("Logout error:", error?.message || error);
    throw createError({
      statusCode: 500,
      statusMessage: error?.message || "Internal Server Error",
    });
  }
});
