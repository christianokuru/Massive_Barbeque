import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

function getKeys() {
  const config = useRuntimeConfig();
  const url = config.public.supabaseUrl;
  const anonKey = config.public.supabaseKey;
  if (!url || !anonKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "Supabase is not configured (SUPABASE_URL / SUPABASE_KEY).",
    });
  }
  return { url: url as string, anonKey: anonKey as string };
}

/**
 * User-scoped Supabase client for API routes. Reads/writes auth cookies so
 * the session follows the request. RLS applies — this client can only touch
 * rows the logged-in user is allowed to see.
 */
export function getSupabase(event: any) {
  const { url, anonKey } = getKeys();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        // H3 returns a record; @supabase/ssr expects { name, value }[].
        const parsed = parseCookies(event);
        return Object.entries(parsed).map(([name, value]) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          setCookie(event, name, value, options);
        }
      },
    },
  });
}

/** Service-role client. Bypasses RLS — admin operations only, never for user data. */
export function getServiceSupabase() {
  const config = useRuntimeConfig();
  const { url } = getKeys();
  const serviceKey = config.supabaseServiceRoleKey as string;
  if (!serviceKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "Supabase service role is not configured (SUPABASE_SERVICE_ROLE_KEY).",
    });
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function getAuthUser(event: any) {
  const supabase = getSupabase(event);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function requireUser(event: any) {
  const { supabase, user } = await getAuthUser(event);
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }
  return { supabase, user };
}

export async function requireAdmin(event: any) {
  const { supabase, user } = await requireUser(event);
  // Role lives in app_metadata (set via service-role client) — never fail open.
  const role = (user.app_metadata as any)?.role;
  if (role !== "admin") {
    throw createError({ statusCode: 403, statusMessage: "Forbidden: admin only" });
  }
  return { supabase, user };
}
