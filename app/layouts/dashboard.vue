<script setup lang="ts">
import M3Icon from "@/components/M3Icon.vue";

// Account pages are private — keep them out of the index.
useSeoMeta({ robots: "noindex, nofollow" });

const route = useRoute();

const tabs = [
  { label: "Overview", to: "/dashboard", icon: "dashboard" },
  { label: "Orders", to: "/dashboard/orders", icon: "receipt_long" },
  { label: "Profile", to: "/dashboard/profile", icon: "person" },
];

function isActive(to: string) {
  return to === "/dashboard" ? route.path === to : route.path.startsWith(to);
}
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 pt-6 pb-16 sm:pt-10 md:px-6">
    <!-- Account header: brand home link + a way back to ordering -->
    <header class="mb-6 flex items-center justify-between gap-3">
      <NuxtLink to="/" class="inline-flex min-w-0 items-center gap-2.5" aria-label="Massive Barbeque home">
        <img src="/images/Food/Logos/submark.png" alt="" class="size-9 shrink-0 object-contain" />
        <span class="truncate text-sm font-semibold tracking-wide text-foreground">Massive Barbeque</span>
      </NuxtLink>
      <NuxtLink
        to="/menu"
        class="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-medium tracking-[0.1em] text-foreground uppercase transition-colors hover:border-primary hover:text-primary"
      >
        <M3Icon name="restaurant_menu" :size="16" />
        Menu
      </NuxtLink>
    </header>

    <!-- Tabs: equal thirds on phones (always fits), compact pill on desktop -->
    <nav
      aria-label="Account"
      class="mb-8 grid grid-cols-3 gap-1 rounded-full border border-border bg-card p-1 sm:inline-grid sm:auto-cols-max sm:grid-flow-col sm:grid-cols-none"
    >
      <NuxtLink
        v-for="t in tabs"
        :key="t.to"
        :to="t.to"
        :aria-current="isActive(t.to) ? 'page' : undefined"
        class="flex min-h-11 items-center justify-center gap-1.5 rounded-full px-2 py-2.5 text-[11px] font-medium tracking-[0.08em] uppercase transition-colors sm:px-5 sm:text-xs"
        :class="isActive(t.to) ? 'bg-secondary-container text-on-secondary-container' : 'text-muted-foreground hover:text-foreground'"
      >
        <M3Icon :name="t.icon" :size="18" :filled="isActive(t.to)" />
        {{ t.label }}
      </NuxtLink>
    </nav>
    <slot />
  </div>
</template>
