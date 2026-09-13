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
      const { data } = await supabase.auth.getUser();
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

  async function login(payload: { email: string; password: string }) {
    await $fetch("/api/auth/login", { method: "POST", body: payload });
    await fetchSession();
  }

  async function logout() {
    await $fetch("/api/auth/logout", { method: "POST" });
    user.value = null;
    await navigateTo("/");
  }

  async function requestPasswordReset(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }

  async function updatePassword(password: string) {
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
