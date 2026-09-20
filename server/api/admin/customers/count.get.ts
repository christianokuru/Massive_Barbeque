import { requireAdmin } from "~~/server/utils/supabase";
import { countCustomers } from "~~/server/utils/customerCount";

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event);

    return { totalCustomers: await countCustomers() };
  } catch (error: any) {
    console.error("Admin customer count error:", error?.message || error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to count customers",
    });
  }
});
