<script setup lang="ts">
useSeoMeta({ title: "Log in | Massive Barbeque" });
import { toast } from "vue-sonner";
import PasswordInput from "../components/custom/general/PasswordInput.vue";
const { login, isAdmin } = useAuth();
const route = useRoute();
const form = ref({ email: "", password: "" });
const error = ref("");
const loading = ref(false);

async function submit() {
  error.value = "";
  loading.value = true;
  try {
    await login(form.value);
    // Return to the guarded page if present, else role home.
    // Only internal paths are honored (open-redirect protection).
    const redirect = String(route.query.redirect || "");
    const safe = redirect.startsWith("/") && !redirect.startsWith("//");
    await navigateTo(safe ? redirect : isAdmin.value ? "/admin" : "/dashboard");
    toast.success("Welcome back!");
  } catch (e: any) {
    error.value = e?.data?.statusMessage || e?.message || "Invalid email or password.";
    toast.error(error.value, { duration: 8000 });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="mx-auto max-w-md px-4 py-20 sm:py-24">
    <h1 class="text-2xl font-bold sm:text-3xl">Welcome back</h1>
    <p class="mt-1 text-sm text-muted-foreground">Log in to track orders and check out faster.</p>
    <form class="mt-6 space-y-4" @submit.prevent="submit">
      <label class="block"><span class="mb-1 block text-sm font-medium">Email</span><input v-model="form.email" type="email" required class="w-full rounded border border-border bg-background px-3 py-2" /></label>
      <label class="block"><span class="mb-1 block text-sm font-medium">Password</span><PasswordInput v-model="form.password" required /></label>
      <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
      <button :disabled="loading" class="w-full rounded bg-primary px-6 py-3 text-primary-foreground disabled:opacity-50">{{ loading ? "Logging in…" : "Log in" }}</button>
    </form>
    <p class="mt-4 text-sm text-muted-foreground">No account? <NuxtLink to="/register" class="text-primary hover:underline">Create one</NuxtLink> · <NuxtLink to="/forgot-password" class="text-primary hover:underline">Forgot password?</NuxtLink></p>
  </div>
</template>
