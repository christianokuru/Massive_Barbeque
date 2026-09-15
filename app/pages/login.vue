<script setup lang="ts">
import { toast } from "vue-sonner";
import AuthShell from "@/components/custom/general/AuthShell.vue";
import PasswordInput from "@/components/custom/general/PasswordInput.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

definePageMeta({ layout: "auth" });
useSeoMeta({ title: "Log in | Massive Barbeque" });

const { login, isAdmin } = useAuth();
const route = useRoute();
const form = ref({ email: "", password: "" });
const error = ref("");
const showSignup = ref(false);
const loading = ref(false);

async function submit() {
  error.value = "";
  showSignup.value = false;
  loading.value = true;
  try {
    await login(form.value);
    // Return to the guarded page if present, else role home.
    // Only internal paths are honored (open-redirect protection).
    const redirect = String(route.query.redirect || "");
    const safe = redirect.startsWith("/") && !redirect.startsWith("//");
    await navigateTo(safe ? redirect : isAdmin.value ? "/admin" : "/menu");
    toast.success("Welcome back!");
  } catch (e: any) {
    error.value = e?.data?.statusMessage || e?.message || "Invalid email or password.";
    showSignup.value = e?.data?.statusCode === 404;
    toast.error(error.value, { duration: 8000 });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AuthShell>
    <form class="flex flex-col gap-6" @submit.prevent="submit">
      <div class="flex flex-col items-center gap-2 text-center">
        <h1 class="text-2xl font-bold">Welcome back</h1>
        <p class="text-sm text-muted-foreground">Log in to track orders and check out faster.</p>
      </div>
      <div class="grid gap-6">
        <div class="grid gap-3">
          <Label for="login-email">Email</Label>
          <Input id="login-email" v-model="form.email" type="email" placeholder="you@example.com" required autocomplete="email" />
        </div>
        <div class="grid gap-3">
          <div class="flex items-center">
            <Label for="login-password">Password</Label>
            <NuxtLink to="/forgot-password" class="ml-auto text-sm underline-offset-4 hover:underline">Forgot your password?</NuxtLink>
          </div>
          <PasswordInput id="login-password" v-model="form.password" required placeholder="••••••••" />
        </div>
        <p v-if="error" class="text-sm text-destructive">
          {{ error }}
          <NuxtLink v-if="showSignup" to="/register" class="ml-1 underline underline-offset-4">Create one</NuxtLink>
        </p>
        <Button type="submit" class="w-full" :disabled="loading">{{ loading ? "Logging in…" : "Log in" }}</Button>
      </div>
      <div class="text-center text-sm">
        No account?
        <NuxtLink to="/register" class="underline underline-offset-4">Create one</NuxtLink>
      </div>
    </form>
  </AuthShell>
</template>
