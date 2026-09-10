<script setup lang="ts">
useSeoMeta({ title: "Forgot password | Massive Barbeque" });
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
  <div class="mx-auto max-w-md px-4 py-20 sm:py-24">
    <h1 class="text-2xl font-bold sm:text-3xl">Reset password</h1>
    <p class="mt-1 text-sm text-muted-foreground">Enter your account email and we'll send you a reset link.</p>
    <form class="mt-6 space-y-4" @submit.prevent="submit">
      <label class="block"><span class="mb-1 block text-sm font-medium">Email</span><input v-model="email" type="email" required class="w-full rounded border border-border bg-background px-3 py-2" /></label>
      <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
      <p v-if="notice" class="text-sm text-tertiary">{{ notice }}</p>
      <button :disabled="loading" class="w-full rounded bg-primary px-6 py-3 text-primary-foreground disabled:opacity-50">{{ loading ? "Sending…" : "Send reset link" }}</button>
    </form>
    <p class="mt-4 text-sm text-muted-foreground"><NuxtLink to="/login" class="text-primary hover:underline">Back to log in</NuxtLink></p>
  </div>
</template>
