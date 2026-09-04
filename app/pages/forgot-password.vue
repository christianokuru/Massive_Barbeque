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
  <div class="mx-auto max-w-md px-4 py-24">
    <h1 class="text-3xl font-bold">Reset password</h1>
    <p class="mt-1 text-sm text-gray-500">Enter your account email and we'll send you a reset link.</p>
    <form class="mt-6 space-y-4" @submit.prevent="submit">
      <label class="block"><span class="mb-1 block text-sm font-medium">Email</span><input v-model="email" type="email" required class="w-full rounded border border-gray-300 px-3 py-2" /></label>
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <p v-if="notice" class="text-sm text-green-700">{{ notice }}</p>
      <button :disabled="loading" class="w-full rounded bg-black px-6 py-3 text-white disabled:opacity-50">{{ loading ? "Sending…" : "Send reset link" }}</button>
    </form>
    <p class="mt-4 text-sm text-gray-500"><NuxtLink to="/login" class="text-[#FF6B35] hover:underline">Back to log in</NuxtLink></p>
  </div>
</template>
