import { z } from "zod";
import { getSupabase } from "~~/server/utils/supabase";
import { isRateLimited } from "~~/server/utils/rateLimit";
import { ensureAdminRole } from "~~/server/utils/adminBootstrap";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export default defineEventHandler(async (event) => {
  try {
    // Brute-force protection: 10 attempts per IP per 15 minutes.
    const ip = getRequestIP(event) || "unknown";
    const { limited, retryAfterSecs } = isRateLimited(`login:${ip}`, {
      limit: 10,
      windowSecs: 900,
    });
    if (limited) {
      setResponseHeader(event, "Retry-After", String(retryAfterSecs));
      throw createError({
        statusCode: 429,
        statusMessage: "Too many login attempts. Try again later.",
      });
    }

    const body = await readValidatedBody(event, loginSchema.parse);
    const supabase = getSupabase(event);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });
    if (error || !data.user) {
      throw createError({ statusCode: 401, statusMessage: "Invalid credentials" });
    }

    // Bootstrap: promote allow-listed emails to admin on sign-in.
    await ensureAdminRole(data.user.id, data.user.email || body.email);

    // Session cookies are set on the response by the Supabase server
    // client — the browser stays logged in across SSR and client nav.
    return { success: true, user: data.user };
  } catch (error: any) {
    console.error("Login error:", error?.message || error);

    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid form data",
        data: error.errors,
      });
    }
    if (error?.statusCode) throw error;

    throw createError({
      statusCode: 500,
      statusMessage: error?.message || "Internal Server Error",
    });
  }
});
