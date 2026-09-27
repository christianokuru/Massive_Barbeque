import { z } from "zod";
import { requireUser } from "~~/server/utils/supabase";
import { addressSchema, updateAddress } from "~~/server/utils/addressbook";
import { isRateLimited } from "~~/server/utils/rateLimit";
import { getClientIp } from "~~/server/utils/clientIp";

export default defineEventHandler(async (event) => {
  try {
    const id = Number(getRouterParam(event, "id"));
    if (!id) throw createError({ statusCode: 400, statusMessage: "Address ID required" });

    const ip = getClientIp(event);
    const { limited } = isRateLimited(`addresses:${ip}`, { limit: 30, windowSecs: 3600 });
    if (limited) {
      throw createError({ statusCode: 429, statusMessage: "Too many attempts. Try again later." });
    }

    const { supabase, user } = await requireUser(event);
    const body = await readValidatedBody(event, addressSchema.parse);

    const address = await updateAddress(supabase, user.id, id, body);
    if (!address) throw createError({ statusCode: 404, statusMessage: "Address not found." });

    return { success: true, address };
  } catch (error: any) {
    console.error("Address update error:", error?.message || error);

    if (error instanceof z.ZodError) {
      throw createError({ statusCode: 400, statusMessage: "Invalid form data", data: error.errors });
    }
    if (error?.statusCode) throw error;

    throw createError({ statusCode: 500, statusMessage: "Failed to update address" });
  }
});
