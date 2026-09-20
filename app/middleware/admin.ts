// Requires an admin user. Guests go to the staff door (/admin/login —
// never the customer /login); logged-in non-admins go home (avoids
// leaking which admin pages exist).
// Server-safe: reads the session via the API when rendering on server.
//
// Single-flight session: this middleware is the ONLY per-navigation
// session fetch. It writes the result into the shared useAuth state
// (SSR: serialized to the client via payload), so pages and components
// below must read state, never fetch again.
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
    // One navigation = one session round trip: fetchSession populates the
    // user, fetchIsOwner populates ownership. Pages below read this state.
    const { user, fetchSession, fetchIsOwner } = useAuth();
    if (!user.value) await fetchSession();
    await fetchIsOwner();
    currentUser = user.value;
  }
  if (!currentUser) {
    return navigateTo({ path: "/admin/login" });
  }
  if (currentUser.app_metadata?.role !== "admin") {
    return navigateTo("/");
  }
});
