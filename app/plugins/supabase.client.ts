import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client (singleton). Session persists via cookies
// managed by @supabase/ssr, so server routes see the same user.
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const supabase = createBrowserClient(
    config.public.supabaseUrl,
    config.public.supabaseKey
  );
  return { provide: { supabase } };
});
