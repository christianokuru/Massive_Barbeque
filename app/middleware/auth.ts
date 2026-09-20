// Requires a logged-in user. Redirects guests to /login, preserving
// the destination so they land back after signing in.
// Server-safe: reads the session via the API when rendering on server.
//
// Single-flight session (see admin.ts): the middleware writes the shared
// useAuth state, pages below only read it.
export default defineNuxtRouteMiddleware(async (to) => {
  let currentUser: any = null;
  if (process.server) {
    const data = await $fetch<{ user: any; isOwner: boolean }>("/api/auth/session", {
      headers: useRequestHeaders(["cookie"]),
    }).catch(() => ({ user: null, isOwner: false }));
    currentUser = data.user;
    const auth = useAuth();
    auth.user.value = data.user;
    auth.isOwner.value = !!data.isOwner;
  } else {
    const { user, fetchSession } = useAuth();
    if (!user.value) await fetchSession();
    currentUser = user.value;
  }
  if (!currentUser) {
    return navigateTo({ path: "/login", query: { redirect: to.fullPath } });
  }
});
