<script setup lang="ts">
useSeoMeta({ title: "Create account | Massive Barbeque" });
import { toast } from "vue-sonner";
import PasswordInput from "../components/custom/general/PasswordInput.vue";
const { register, isAdmin } = useAuth();
const route = useRoute();
const form = ref({ name: "", email: "", password: "" });
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
    // Only internal paths are honored (open-redirect protection).
    const redirect = String(route.query.redirect || "");
    const safe = redirect.startsWith("/") && !redirect.startsWith("//");
    const dest = safe ? redirect : isAdmin.value ? "/admin" : "/dashboard";
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
  <div class="mx-auto max-w-md px-4 py-24">
    <h1 class="text-3xl font-bold">Create account</h1>
    <p class="mt-1 text-sm text-gray-500">Save addresses, track orders, reorder in one tap.</p>
    <form class="mt-6 space-y-4" @submit.prevent="submit">
      <label class="block"><span class="mb-1 block text-sm font-medium">Name</span><input v-model="form.name" required minlength="2" class="w-full rounded border border-gray-300 px-3 py-2" /></label>
      <label class="block"><span class="mb-1 block text-sm font-medium">Email</span><input v-model="form.email" type="email" required class="w-full rounded border border-gray-300 px-3 py-2" /></label>
      <label class="block"><span class="mb-1 block text-sm font-medium">Password (min 8 chars)</span><PasswordInput v-model="form.password" required minlength="8" autocomplete="new-password" /></label>
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <p v-if="notice" class="text-sm text-green-700">{{ notice }}</p>
      <button :disabled="loading" class="w-full rounded bg-black px-6 py-3 text-white disabled:opacity-50">{{ loading ? "Creating…" : "Create account" }}</button>
    </form>
    <p class="mt-4 text-sm text-gray-500">Have an account? <NuxtLink to="/login" class="text-[#FF6B35] hover:underline">Log in</NuxtLink></p>
  </div>
</template>
