// Requires an admin user. Guests go to the staff door (/admin/login —
// never the customer /login); logged-in non-admins go home (avoids
// leaking which admin pages exist).
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
    return navigateTo({ path: "/admin/login" });
  }
  if (currentUser.app_metadata?.role !== "admin") {
    return navigateTo("/");
  }
});
