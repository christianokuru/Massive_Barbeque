import { z } from "zod";
import { requireUser } from "~~/server/utils/supabase";
import { addressSchema, createAddress } from "~~/server/utils/addressbook";
import { isRateLimited } from "~~/server/utils/rateLimit";
import { getClientIp } from "~~/server/utils/clientIp";

export default defineEventHandler(async (event) => {
  try {
    const ip = getClientIp(event);
    const { limited } = isRateLimited(`addresses:${ip}`, { limit: 30, windowSecs: 3600 });
    if (limited) {
      throw createError({ statusCode: 429, statusMessage: "Too many attempts. Try again later." });
    }

    const { supabase, user } = await requireUser(event);
    const body = await readValidatedBody(event, addressSchema.parse);

    return { success: true, address: await createAddress(supabase, user.id, body) };
  } catch (error: any) {
    console.error("Address creation error:", error?.message || error);

    if (error instanceof z.ZodError) {
      throw createError({ statusCode: 400, statusMessage: "Invalid form data", data: error.errors });
    }
    if (error?.statusCode) throw error;

    throw createError({ statusCode: 500, statusMessage: "Failed to save address" });
  }
});
