import { getAuthUser } from "~~/server/utils/supabase";

export default defineEventHandler(async (event) => {
  try {
    const { user } = await getAuthUser(event);
    return { user };
  } catch {
    return { user: null };
  }
});
