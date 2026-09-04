<script setup lang="ts">
useSeoMeta({ title: "Set new password | Massive Barbeque" });
const { updatePassword, fetchSession } = useAuth();
const supabase = useSupabase();
const password = ref("");
const notice = ref("");
const error = ref("");
const loading = ref(false);
const ready = ref(false);

// The recovery link signs the user in — wait for that session first.
onMounted(async () => {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    await fetchSession();
    ready.value = true;
  } else {
    const { data: listener } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "PASSWORD_RECOVERY") {
        await fetchSession();
        ready.value = true;
        listener.subscription.unsubscribe();
      }
    });
    // Fallback: link may already be consumed via URL hash parsing.
    setTimeout(() => {
      if (!ready.value) error.value = "This reset link is invalid or expired. Request a new one.";
    }, 8000);
  }
});

async function submit() {
  error.value = "";
  loading.value = true;
  try {
    await updatePassword(password.value);
    notice.value = "Password updated — taking you to your dashboard.";
    setTimeout(() => navigateTo("/dashboard"), 1500);
  } catch {
    error.value = "Could not update the password. Try again.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="mx-auto max-w-md px-4 py-24">
    <h1 class="text-3xl font-bold">Set new password</h1>
    <p class="mt-1 text-sm text-gray-500">Choose a new password (min 8 characters).</p>
    <form v-if="ready" class="mt-6 space-y-4" @submit.prevent="submit">
      <label class="block"><span class="mb-1 block text-sm font-medium">New password</span><PasswordInput v-model="password" required minlength="8" autocomplete="new-password" /></label>
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <p v-if="notice" class="text-sm text-green-700">{{ notice }}</p>
      <button :disabled="loading" class="w-full rounded bg-black px-6 py-3 text-white disabled:opacity-50">{{ loading ? "Saving…" : "Save new password" }}</button>
    </form>
    <p v-else class="mt-6 text-sm text-gray-500">{{ error || "Verifying your reset link…" }}</p>
  </div>
</template>
