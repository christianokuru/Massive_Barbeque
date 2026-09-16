<script setup lang="ts">
import M3Icon from "@/components/M3Icon.vue";
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

const memberSince = computed(() => {
  const iso = user.value?.created_at;
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-NG", { month: "long", year: "numeric" });
});

const links = [
  { label: "Order history", text: "Track and reorder your feasts", to: "/dashboard/orders", icon: "receipt_long" },
  { label: "Browse the menu", text: "See what's fresh off the grill", to: "/menu", icon: "restaurant_menu" },
  { label: "Contact us", text: "Questions about an order?", to: "/contact", icon: "support_agent" },
];
</script>

<template>
  <div>
    <p class="m3-label-lg uppercase tracking-[0.2em] text-primary">Account</p>
    <h1 class="m3-display-sm mt-2 sm:m3-display-md">Profile</h1>

    <!-- Identity card -->
    <section class="relative mt-6 overflow-hidden rounded-3xl bg-primary-container text-on-primary-container">
      <M3Icon
        name="person"
        :size="200"
        class="pointer-events-none absolute -right-6 -bottom-8 opacity-10"
      />
      <div class="relative flex items-center gap-5 p-6 sm:p-8">
        <Avatar class="h-20 w-20 shrink-0 ring-4 ring-primary/20">
          <AvatarFallback class="bg-primary text-2xl font-semibold text-primary-foreground">
            {{ initials }}
          </AvatarFallback>
        </Avatar>
        <div class="min-w-0">
          <p class="m3-headline-sm truncate">{{ displayName || "Foodie" }}</p>
          <p class="m3-body-md mt-0.5 truncate opacity-80">{{ user?.email }}</p>
          <p v-if="memberSince" class="m3-label-md mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-primary-foreground">
            <M3Icon name="celebration" :size="16" />
            Member since {{ memberSince }}
          </p>
        </div>
      </div>
    </section>

    <!-- Details -->
    <section aria-label="Account details" class="mt-4 rounded-3xl border border-border bg-card">
      <dl class="divide-y divide-border px-6">
        <div class="flex items-center gap-4 py-4">
          <span class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
            <M3Icon name="badge" :size="20" />
          </span>
          <div class="min-w-0 flex-1">
            <dt class="m3-label-md uppercase tracking-[0.1em] text-muted-foreground">Name</dt>
            <dd class="m3-title-sm mt-0.5 truncate">{{ displayName || "—" }}</dd>
          </div>
        </div>
        <div class="flex items-center gap-4 py-4">
          <span class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
            <M3Icon name="mail" :size="20" />
          </span>
          <div class="min-w-0 flex-1">
            <dt class="m3-label-md uppercase tracking-[0.1em] text-muted-foreground">Email</dt>
            <dd class="m3-title-sm mt-0.5 truncate">{{ user?.email || "—" }}</dd>
          </div>
        </div>
      </dl>
    </section>

    <!-- Quick links -->
    <section aria-label="Quick links" class="mt-4 space-y-3">
      <NuxtLink
        v-for="l in links"
        :key="l.to + l.label"
        :to="l.to"
        class="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-shadow"
      >
        <span class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
          <M3Icon :name="l.icon" :size="22" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="m3-title-sm">{{ l.label }}</p>
          <p class="m3-body-sm mt-0.5 truncate text-muted-foreground">{{ l.text }}</p>
        </div>
        <M3Icon name="chevron_right" :size="20" class="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
      </NuxtLink>
    </section>

    <button
      type="button"
      class="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full border border-error/50 px-8 py-3.5 text-xs font-medium uppercase tracking-widest text-error transition-colors hover:bg-error-container hover:text-on-error-container sm:w-auto"
      @click="logout"
    >
      <M3Icon name="logout" :size="18" />
      Log out
    </button>
  </div>
</template>
