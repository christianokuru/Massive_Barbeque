<script setup lang="ts">
import AuthShell from "@/components/custom/general/AuthShell.vue";
import PasswordInput from "@/components/custom/general/PasswordInput.vue";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

definePageMeta({ layout: "auth" });
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
  <AuthShell>
    <form v-if="ready" class="flex flex-col gap-6" @submit.prevent="submit">
      <div class="flex flex-col items-center gap-2 text-center">
        <h1 class="text-2xl font-bold">Set new password</h1>
        <p class="text-sm text-muted-foreground">Choose a new password (min 8 characters).</p>
      </div>
      <div class="grid gap-6">
        <div class="grid gap-3">
          <Label for="reset-password">New password</Label>
          <PasswordInput id="reset-password" v-model="password" required minlength="8" autocomplete="new-password" placeholder="Min 8 characters" />
        </div>
        <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
        <p v-if="notice" class="text-sm text-tertiary">{{ notice }}</p>
        <Button type="submit" class="w-full" :disabled="loading">{{ loading ? "Saving…" : "Save new password" }}</Button>
      </div>
    </form>
    <p v-else class="text-center text-sm text-muted-foreground">{{ error || "Verifying your reset link…" }}</p>
  </AuthShell>
</template>
