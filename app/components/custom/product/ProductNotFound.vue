<script setup lang="ts">
import M3Icon from "@/components/M3Icon.vue";

/* Single responsibility: product-not-found empty state. */

interface Props {
  title?: string;
  message?: string;
  ctaLabel?: string;
  ctaTo?: string;
}

withDefaults(defineProps<Props>(), {
  title: "Product not found",
  message: "This item may have been removed or is no longer available.",
  ctaLabel: "Back to menu",
  ctaTo: "/menu",
});
</script>

<template>
  <div class="mt-6 rounded-xl border border-dashed p-10 text-center">
    <M3Icon name="search_off" :size="40" class="text-muted-foreground" />
    <h1 class="m3-headline-sm mt-4 text-foreground">{{ title }}</h1>
    <p class="m3-body-md mt-2 text-muted-foreground">{{ message }}</p>
    <NuxtLink
      :to="ctaTo"
      class="mt-6 inline-block rounded-full bg-primary px-8 py-3 text-xs font-medium uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90"
    >
      {{ ctaLabel }}
    </NuxtLink>
  </div>
</template>
