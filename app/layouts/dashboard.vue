<script setup lang="ts">
const route = useRoute();

const tabs = [
  { label: "Overview", to: "/dashboard" },
  { label: "Orders", to: "/dashboard/orders" },
  { label: "Profile", to: "/dashboard/profile" },
];

function isActive(to: string) {
  return to === "/dashboard" ? route.path === to : route.path.startsWith(to);
}
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-20 sm:py-24 md:px-6">
    <nav aria-label="Account" class="mb-8 flex gap-1 overflow-x-auto rounded-full border border-border bg-card p-1 sm:inline-flex">
      <NuxtLink
        v-for="t in tabs"
        :key="t.to"
        :to="t.to"
        :aria-current="isActive(t.to) ? 'page' : undefined"
        class="shrink-0 rounded-full px-5 py-2 text-xs font-medium tracking-[0.1em] uppercase transition-colors"
        :class="isActive(t.to) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'"
      >
        {{ t.label }}
      </NuxtLink>
    </nav>
    <slot />
  </div>
</template>
