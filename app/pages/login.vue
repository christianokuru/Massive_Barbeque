<script setup lang="ts">
useSeoMeta({ title: "Log in | Massive Barbeque" });
const { login } = useAuth();
const form = ref({ email: "", password: "" });
const error = ref("");
const loading = ref(false);

async function submit() {
  error.value = "";
  loading.value = true;
  try {
    await login(form.value);
    await navigateTo("/dashboard");
  } catch (e: any) {
    error.value = e?.data?.message || "Invalid email or password.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="mx-auto max-w-md px-4 py-24">
    <h1 class="text-3xl font-bold">Welcome back</h1>
    <p class="mt-1 text-sm text-gray-500">Log in to track orders and check out faster.</p>
    <form class="mt-6 space-y-4" @submit.prevent="submit">
      <label class="block"><span class="mb-1 block text-sm font-medium">Email</span><input v-model="form.email" type="email" required class="w-full rounded border border-gray-300 px-3 py-2" /></label>
      <label class="block"><span class="mb-1 block text-sm font-medium">Password</span><input v-model="form.password" type="password" required class="w-full rounded border border-gray-300 px-3 py-2" /></label>
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <button :disabled="loading" class="w-full rounded bg-black px-6 py-3 text-white disabled:opacity-50">{{ loading ? "Logging in…" : "Log in" }}</button>
    </form>
    <p class="mt-4 text-sm text-gray-500">No account? <NuxtLink to="/register" class="text-[#FF6B35] hover:underline">Create one</NuxtLink></p>
  </div>
</template>
