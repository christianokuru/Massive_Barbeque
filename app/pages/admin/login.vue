<script setup lang="ts">
import { toast } from "vue-sonner";
import AuthShell from "@/components/custom/general/AuthShell.vue";
import PasswordInput from "@/components/custom/general/PasswordInput.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Staff-only door. Deliberately NO "admin" middleware (guests must reach
// it) and the bare auth layout (no console chrome). Shares the customer
// session system — no parallel auth. Never indexed. No redirect param:
// successful staff sign-in always lands on /admin.
definePageMeta({ layout: "auth" });
useSeoMeta({ title: "Staff sign in", robots: "noindex, nofollow" });

const { user, login, isAdmin, isLoggedIn, fetchSession } = useAuth();
const form = ref({ email: "", password: "" });
const error = ref("");
const loading = ref(false);

// Signed-in staff go straight to the console.
onMounted(async () => {
  if (!isLoggedIn.value) await fetchSession().catch(() => null);
  if (isAdmin.value) await navigateTo("/admin");
});

async function submit() {
  error.value = "";
  loading.value = true;
  try {
    await login({ ...form.value, portal: "admin" });
    if (!isAdmin.value) {
      // Valid non-staff credentials at the staff door (the server already
      // revoked the session — this is belt-and-braces for cookie edge
      // cases). Answer generically: never confirm the account or its role.
      await $fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
      user.value = null;
      throw new Error("Invalid email or password.");
    }
    await navigateTo("/admin");
    toast.success("Welcome back!");
  } catch (e: any) {
    // No sign-up offer here — the staff door never advertises registration.
    error.value = e?.data?.statusMessage || e?.message || "Invalid email or password.";
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
        <h1 class="text-2xl font-bold">Staff sign in</h1>
        <p class="text-sm text-muted-foreground">Restricted area. Authorized personnel only.</p>
      </div>
      <div class="grid gap-6">
        <div class="grid gap-3">
          <Label for="admin-email">Email</Label>
          <Input id="admin-email" v-model="form.email" type="email" placeholder="you@example.com" required autocomplete="email" />
        </div>
        <div class="grid gap-3">
          <Label for="admin-password">Password</Label>
          <PasswordInput id="admin-password" v-model="form.password" required placeholder="••••••••" />
        </div>
        <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
        <Button type="submit" class="w-full" :disabled="loading">{{ loading ? "Signing in…" : "Sign in" }}</Button>
      </div>
    </form>
  </AuthShell>
</template>
