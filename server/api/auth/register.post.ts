import { z } from "zod";
import { getSupabase } from "~~/server/utils/supabase";
import { isRateLimited } from "~~/server/utils/rateLimit";
import { ensureAdminRole } from "~~/server/utils/adminBootstrap";
import { claimGuestOrders } from "~~/server/utils/orderClaim";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

export default defineEventHandler(async (event) => {
  try {
    // Abuse protection: 5 registrations per IP per hour.
    const ip = getRequestIP(event) || "unknown";
    const { limited, retryAfterSecs } = isRateLimited(`register:${ip}`, {
      limit: 5,
      windowSecs: 3600,
    });
    if (limited) {
      setResponseHeader(event, "Retry-After", String(retryAfterSecs));
      throw createError({
        statusCode: 429,
        statusMessage: "Too many registrations. Try again later.",
      });
    }

    const body = await readValidatedBody(event, registerSchema.parse);
    const supabase = getSupabase(event);

    const { data, error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: { data: { name: body.name } },
    });

    // Duplicate email arrives two ways depending on settings: a 422
    // `user_already_exists` error (confirm-email OFF) or a user with no
    // identities (confirm-email ON). Either way, fall through to sign-in,
    // which only succeeds with the correct password (proves ownership —
    // never logs in on email alone).
    const isDuplicate =
      (error && (error.status === 422 || (error as any).code === "user_already_exists")) ||
      (!!data.user && (data.user.identities?.length ?? 1) === 0);

    if (isDuplicate) {
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: body.email,
          password: body.password,
        });
      if (signInError || !signInData.user) {
        throw createError({
          statusCode: 401,
          statusMessage:
            "An account with this email already exists. Is that you? The password you entered is incorrect.",
        });
      }
      await ensureAdminRole(signInData.user.id, signInData.user.email || body.email);
      await claimGuestOrders(signInData.user.id, signInData.user.email || body.email);
      return { success: true, user: signInData.user, signedInInstead: true };
    }

    if (error) throw error;

    if (!data.user) {
      throw createError({ statusCode: 400, statusMessage: "Registration failed" });
    }

    await ensureAdminRole(data.user.id, data.user.email || body.email);

    // Only claim when a session was actually created (confirm-email OFF).
    // If email confirmation is required, the user isn't logged in yet —
    // they'll claim on first real login after clicking the link.
    if (data.session) {
      await claimGuestOrders(data.user.id, data.user.email || body.email);
    }

    // No session here means "Confirm email" is enabled in Supabase Auth
    // settings — the user must click the email link before signing in.
    return {
      success: true,
      user: data.user,
      emailConfirmationRequired: !data.session,
    };
  } catch (error: any) {
    console.error("Registration error:", error?.message || error);

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
