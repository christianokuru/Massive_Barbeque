<script setup lang="ts">
import M3Icon from "@/components/M3Icon.vue";

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
  <div class="mx-auto max-w-6xl px-4 pt-20 pb-16 sm:pt-24 md:px-6">
    <nav aria-label="Account" class="mb-8 flex gap-1 overflow-x-auto rounded-full border border-border bg-card p-1.5 shadow-m3-1 sm:inline-flex">
      <NuxtLink
        v-for="t in tabs"
        :key="t.to"
        :to="t.to"
        :aria-current="isActive(t.to) ? 'page' : undefined"
        class="flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-xs font-medium tracking-[0.1em] uppercase transition-colors"
        :class="isActive(t.to) ? 'bg-secondary-container text-on-secondary-container' : 'text-muted-foreground hover:text-foreground'"
      >
        <M3Icon :name="t.icon" :size="18" :filled="isActive(t.to)" />
        {{ t.label }}
      </NuxtLink>
    </nav>
    <slot />
  </div>
</template>
