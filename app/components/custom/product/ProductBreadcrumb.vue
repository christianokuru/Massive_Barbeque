<script setup lang="ts">
import M3Icon from "@/components/M3Icon.vue";

/* Single responsibility: breadcrumb trail.
   Trail arrives via props; last item is the current page. */

export interface Crumb {
  label: string;
  to?: string;
}

interface Props {
  items: Crumb[];
}

defineProps<Props>();
</script>

<template>
  <nav aria-label="Breadcrumb">
    <ol class="flex flex-wrap items-center gap-1 text-sm">
      <li v-for="(item, i) in items" :key="item.label" class="flex items-center gap-1">
        <M3Icon v-if="i > 0" name="chevron_right" :size="16" class="text-muted-foreground" />
        <NuxtLink
          v-if="item.to && i < items.length - 1"
          :to="item.to"
          class="text-muted-foreground hover:text-primary hover:underline"
        >
          {{ item.label }}
        </NuxtLink>
        <span v-else :aria-current="i === items.length - 1 ? 'page' : undefined" class="font-medium text-foreground">
          {{ item.label }}
        </span>
      </li>
    </ol>
  </nav>
</template>
