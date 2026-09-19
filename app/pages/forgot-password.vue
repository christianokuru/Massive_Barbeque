<script setup lang="ts">
import AuthShell from "@/components/custom/general/AuthShell.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

definePageMeta({ layout: "auth" });
useSeoMeta({ title: "Forgot password" });

const { requestPasswordReset } = useAuth();
const email = ref("");
const notice = ref("");
const error = ref("");
const loading = ref(false);

async function submit() {
  error.value = "";
  notice.value = "";
  loading.value = true;
  try {
    await requestPasswordReset(email.value);
    notice.value = "If an account exists for that email, a reset link is on its way.";
  } catch {
    error.value = "Could not send the reset link. Try again.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AuthShell>
    <form class="flex flex-col gap-6" @submit.prevent="submit">
      <div class="flex flex-col items-center gap-2 text-center">
        <h1 class="text-2xl font-bold">Reset password</h1>
        <p class="text-sm text-muted-foreground">Enter your account email and we'll send you a reset link.</p>
      </div>
      <div class="grid gap-6">
        <div class="grid gap-3">
          <Label for="forgot-email">Email</Label>
          <Input id="forgot-email" v-model="email" type="email" placeholder="you@example.com" required autocomplete="email" />
        </div>
        <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
        <p v-if="notice" class="text-sm text-tertiary">{{ notice }}</p>
        <Button type="submit" class="w-full" :disabled="loading">{{ loading ? "Sending…" : "Send reset link" }}</Button>
      </div>
      <div class="text-center text-sm">
        <NuxtLink to="/login" class="underline underline-offset-4">Back to log in</NuxtLink>
      </div>
    </form>
  </AuthShell>
</template>
