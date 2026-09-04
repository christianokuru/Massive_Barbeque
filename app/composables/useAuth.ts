export function useAuth() {
  const user = useState<any>("auth:user", () => null);
  const pending = useState<boolean>("auth:pending", () => true);

  async function fetchSession() {
    pending.value = true;
    try {
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
    await $fetch("/api/auth/register", { method: "POST", body: payload });
    await fetchSession();
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

  const isLoggedIn = computed(() => !!user.value);
  const isAdmin = computed(() => (user.value as any)?.role === "admin");

  return { user, pending, isLoggedIn, isAdmin, fetchSession, register, login, logout };
}
