import { defineApi } from "~~/server/utils/api";
import { requireAdmin } from "~~/server/utils/supabase";
import { countCustomers } from "~~/server/utils/customerCount";

// GET /api/admin/customers/count — registered non-admin accounts (cached 60s).
export default defineApi(async (event) => {
  await requireAdmin(event);
  return { totalCustomers: await countCustomers() };
});
