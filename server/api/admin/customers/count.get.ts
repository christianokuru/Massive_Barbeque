import { requireAdmin } from "~~/server/utils/supabase";
import { getServiceSupabase } from "~~/server/utils/supabase";

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event);

    const admin = getServiceSupabase();
    let total = 0;
    let page = 1;
    const perPage = 1000;
    for (;;) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
      if (error) throw error;
      const users = data?.users ?? [];
      total += users.length;
      if (users.length < perPage) break;
      page += 1;
    }

    return { totalCustomers: total };
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
