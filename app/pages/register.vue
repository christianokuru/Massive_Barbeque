<script setup lang="ts">
import { toast } from "vue-sonner";
import AuthShell from "@/components/custom/general/AuthShell.vue";
import PasswordInput from "@/components/custom/general/PasswordInput.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

definePageMeta({ layout: "auth" });
useSeoMeta({ title: "Create account" });

const { register, isAdmin } = useAuth();
const route = useRoute();
const form = ref({ name: "", email: String(route.query.email || ""), password: "" });
const error = ref("");
const notice = ref("");
const loading = ref(false);

async function submit() {
  error.value = "";
  notice.value = "";
  loading.value = true;
  try {
    const data = await register(form.value);
    if (data?.emailConfirmationRequired) {
      notice.value = "Account created — check your inbox for a confirmation link, then log in.";
      toast.info("Check your inbox to confirm your email.");
      return;
    }
    if (data?.signedInInstead) {
      notice.value = "You already had an account — welcome back, you're signed in.";
      toast.success("Welcome back — you're signed in.");
    } else {
      toast.success("Account created — welcome!");
    }
    // Only provably internal paths are honored (open-redirect protection).
    const dest = safeRedirectPath(route.query.redirect) ?? (isAdmin.value ? "/admin" : "/menu");
    if (data?.signedInInstead) {
      // Let them read the "welcome back" note before leaving.
      await new Promise((r) => setTimeout(r, 1800));
    }
    await navigateTo(dest);
  } catch (e: any) {
    error.value = e?.data?.statusMessage || e?.message || "Could not create account. Try again.";
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
        <h1 class="text-2xl font-bold">Create account</h1>
        <p class="text-sm text-muted-foreground">Save addresses, track orders, reorder in one tap.</p>
      </div>
      <div class="grid gap-6">
        <div class="grid gap-3">
          <Label for="register-name">Name</Label>
          <Input id="register-name" v-model="form.name" placeholder="Adaeze Okafor" required minlength="2" autocomplete="name" />
        </div>
        <div class="grid gap-3">
          <Label for="register-email">Email</Label>
          <Input id="register-email" v-model="form.email" type="email" placeholder="you@example.com" required autocomplete="email" />
        </div>
        <div class="grid gap-3">
          <Label for="register-password">Password</Label>
          <PasswordInput id="register-password" v-model="form.password" required minlength="8" autocomplete="new-password" placeholder="Min 8 characters" />
        </div>
        <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
        <p v-if="notice" class="text-sm text-tertiary">{{ notice }}</p>
        <Button type="submit" class="w-full" :disabled="loading">{{ loading ? "Creating…" : "Create account" }}</Button>
      </div>
      <div class="text-center text-sm">
        Have an account?
        <NuxtLink to="/login" class="underline underline-offset-4">Log in</NuxtLink>
      </div>
    </form>
  </AuthShell>
</template>
