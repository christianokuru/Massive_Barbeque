export function useSupabase() {
  return useNuxtApp().$supabase;
}
