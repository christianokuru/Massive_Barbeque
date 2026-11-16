import { z } from "zod";
import { apiError, defineApi, parseBody } from "~~/server/utils/api";
import { getSupabase } from "~~/server/utils/supabase";
import { isUserFacingAuthError, throttleByEmail } from "~~/server/utils/authHelpers";
import { ensureAdminRole } from "~~/server/utils/adminBootstrap";
import { claimGuestOrders } from "~~/server/utils/orderClaim";

// POST /api/auth/register { email, password, name }
//
// A duplicate email is treated as a sign-in attempt: it only succeeds with
// the account's real password (never logs in on email alone), and answers
// { signedInInstead: true }. New accounts answer
// { emailConfirmationRequired } — true when Supabase's "Confirm email" is on.
const schema = z.object({
  email: z.string({ required_error: "Enter your email address." }).trim().toLowerCase().email("Enter a valid email address.").max(254),
  password: z.string({ required_error: "Choose a password." }).min(8, "Password must be at least 8 characters.").max(200),
  name: z.string({ required_error: "Enter your name." }).trim().min(2, "Name must be at least 2 characters.").max(100),
});

export default defineApi(async (event) => {
  await throttleByEmail(event, "register", {
    limit: 5,
    windowSecs: 3600,
    message: "Too many registrations. Try again later.",
  });
  const body = await parseBody(event, schema);
  const supabase = getSupabase(event);

  const { data, error } = await supabase.auth.signUp({
    email: body.email,
    password: body.password,
    options: { data: { name: body.name } },
  });

  // Duplicate email arrives two ways depending on settings: a 422
  // `user_already_exists` (confirm-email OFF) or a user with no identities
  // (confirm-email ON).
  const duplicate =
    (error && ((error as any).status === 422 || (error as any).code === "user_already_exists")) ||
    (!!data?.user && (data.user.identities?.length ?? 1) === 0);

  if (duplicate) {
    const { data: signIn, error: signInError } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });
    if (signInError || !signIn.user) {
      apiError(401, "An account with this email already exists. Is that you? The password you entered is incorrect.");
    }
    await ensureAdminRole(signIn.user.id, signIn.user.email || body.email);
    await claimGuestOrders(signIn.user);
    return { success: true, user: signIn.user, signedInInstead: true };
  }

  if (error) {
    // e.g. "Password is known to be weak" — written for users.
    if (isUserFacingAuthError(error)) apiError(400, error.message);
    throw error;
  }
  if (!data.user) apiError(400, "Registration failed.");

  // Admin bootstrap and guest-order claiming both require a VERIFIED email:
  // a session alone (confirm-email OFF) doesn't prove inbox ownership.
  if (data.session && (data.user as any).email_confirmed_at) {
    await ensureAdminRole(data.user.id, data.user.email || body.email);
  }
  if (data.session) await claimGuestOrders(data.user);

  return { success: true, user: data.user, emailConfirmationRequired: !data.session };
});
