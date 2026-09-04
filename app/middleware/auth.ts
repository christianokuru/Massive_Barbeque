// Requires a logged-in user. Redirects guests to /login, preserving
// the destination so they land back after signing in.
// Server-safe: reads the session via the API when rendering on server.
export default defineNuxtRouteMiddleware(async (to) => {
  let currentUser: any = null;
  if (process.server) {
    const data = await $fetch<{ user: any }>("/api/auth/session", {
      headers: useRequestHeaders(["cookie"]),
    }).catch(() => ({ user: null }));
    currentUser = data.user;
  } else {
    const { user, fetchSession } = useAuth();
    if (!user.value) await fetchSession();
    currentUser = user.value;
  }
  if (!currentUser) {
    return navigateTo({ path: "/login", query: { redirect: to.fullPath } });
  }
});
