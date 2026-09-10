<script setup lang="ts">
import M3Icon from "@/components/M3Icon.vue";

/* Single responsibility: fulfillment expectation strip.
   Rows arrive via props. */

export interface DeliveryInfo {
  icon: string;
  title: string;
  text: string;
}

interface Props {
  items: DeliveryInfo[];
}

defineProps<Props>();
</script>

<template>
  <ul class="grid gap-3 sm:grid-cols-3">
    <li
      v-for="item in items"
      :key="item.title"
      class="flex items-center gap-3 rounded-xl bg-muted p-4"
    >
      <span class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
        <M3Icon :name="item.icon" :size="22" />
      </span>
      <div class="min-w-0">
        <p class="m3-title-sm text-foreground">{{ item.title }}</p>
        <p class="m3-body-sm truncate text-muted-foreground">{{ item.text }}</p>
      </div>
    </li>
  </ul>
</template>
