import { requireUser } from "~~/server/utils/supabase";
import { listAddresses } from "~~/server/utils/addressbook";

export default defineEventHandler(async (event) => {
  try {
    const { supabase, user } = await requireUser(event);
    // User-scoped client: RLS applies on top of the explicit scoping.
    return { addresses: await listAddresses(supabase, user.id) };
  } catch (error: any) {
    console.error("Addresses fetch error:", error?.message || error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch addresses",
    });
  }
});
