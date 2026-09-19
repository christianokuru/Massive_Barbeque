export function useAuth() {
  const supabase = useSupabase();
  const user = useState<any>("auth:user", () => null);
  const pending = useState<boolean>("auth:pending", () => true);
  const isOwner = useState<boolean>("auth:isOwner", () => false);

  async function fetchIsOwner() {
    try {
      const data = await $fetch<{ isOwner: boolean }>("/api/auth/session");
      isOwner.value = !!data.isOwner;
    } catch {
      isOwner.value = false;
    }
    return isOwner.value;
  }

  async function fetchSession() {
    pending.value = true;
    try {
      // Use the server as the source of truth so httpOnly cookies are
      // honoured and the browser client doesn't need to read them via
      // document.cookie. This is the same endpoint the middleware uses.
      const data = await $fetch<{ user: any }>("/api/auth/session");
      user.value = data.user;
    } catch {
      user.value = null;
    } finally {
      pending.value = false;
    }
    return user.value;
  }

  async function register(payload: { name: string; email: string; password: string }) {
    const data = await $fetch<{
      signedInInstead?: boolean;
      emailConfirmationRequired?: boolean;
    }>("/api/auth/register", { method: "POST", body: payload });
    await fetchSession();
    return data;
  }

  async function login(payload: { email: string; password: string; portal?: string }) {
    await $fetch("/api/auth/login", { method: "POST", body: payload });
    await fetchSession();
  }

  async function logout() {
    await $fetch("/api/auth/logout", { method: "POST" });
    user.value = null;
    await navigateTo("/");
  }

  async function requestPasswordReset(email: string) {
    // Server endpoint: throttled + fixed redirect target (never the
    // caller's Origin). Always resolves — unknown emails aren't revealed.
    await $fetch("/api/auth/reset", { method: "POST", body: { email } });
  }

  async function updatePassword(password: string) {
    if (typeof password !== "string" || password.length < 8 || password.length > 72) {
      throw new Error("Password must be 8–72 characters.");
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }

  const isLoggedIn = computed(() => !!user.value);
  const isAdmin = computed(() => user.value?.app_metadata?.role === "admin");
  const displayName = computed(
    () => user.value?.user_metadata?.name || user.value?.email || ""
  );

  return {
    user,
    pending,
    isLoggedIn,
    isAdmin,
    isOwner,
    fetchIsOwner,
    displayName,
    fetchSession,
    register,
    login,
    logout,
    requestPasswordReset,
    updatePassword,
  };
}
