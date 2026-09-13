<script setup lang="ts">
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

definePageMeta({ layout: "dashboard", middleware: "auth" });
const { user, displayName, fetchSession, logout } = useAuth();
if (process.client) {
  await fetchSession();
  if (!user.value) await navigateTo("/login");
}

const initials = computed(() => {
  const name = displayName.value || "?";
  return (
    name
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
});

const rows = computed(() => [
  { label: "Name", value: displayName.value || "—" },
  { label: "Email", value: user.value?.email || "—" },
]);
</script>

<template>
  <div>
    <p class="text-xs font-medium uppercase tracking-[0.4em] text-primary">Account</p>
    <h1 class="m3-display-sm mt-3 md:m3-display-md">Profile</h1>

    <div class="mt-6 max-w-md rounded-2xl border border-border bg-card p-5">
      <div class="flex items-center gap-4">
        <Avatar class="h-14 w-14">
          <AvatarFallback class="bg-primary text-lg font-semibold text-primary-foreground">
            {{ initials }}
          </AvatarFallback>
        </Avatar>
        <div class="min-w-0">
          <p class="truncate font-serif text-xl font-semibold">{{ displayName || "Foodie" }}</p>
          <p class="truncate text-sm text-muted-foreground">{{ user?.email }}</p>
        </div>
      </div>
      <dl class="mt-5 space-y-3 border-t border-border pt-5 text-sm">
        <div v-for="r in rows" :key="r.label" class="flex justify-between gap-3">
          <dt class="shrink-0 text-muted-foreground">{{ r.label }}</dt>
          <dd class="min-w-0 truncate font-medium">{{ r.value }}</dd>
        </div>
      </dl>
    </div>

    <button
      type="button"
      class="mt-6 rounded-full border border-destructive/50 px-8 py-3 text-xs font-medium uppercase tracking-widest text-destructive transition-colors hover:bg-destructive/10"
      @click="logout"
    >
      Log out
    </button>
  </div>
</template>
