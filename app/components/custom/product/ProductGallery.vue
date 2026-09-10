<script setup lang="ts">
import M3Icon from "@/components/M3Icon.vue";
import { Badge } from "@/components/ui/badge";

/* Single responsibility: product media.
   Image + flags arrive via props; tile fallback matches ProductCard. */

interface Props {
  imageUrl?: string | null;
  name: string;
  categoryName?: string | null;
  featured?: boolean;
}

defineProps<Props>();
</script>

<template>
  <div class="relative overflow-hidden rounded-xl bg-muted shadow-m3-1">
    <div class="flex aspect-[4/3] items-center justify-center overflow-hidden">
      <img
        v-if="imageUrl"
        :src="imageUrl"
        :alt="name"
        class="h-full w-full object-cover"
      />
      <div v-else class="flex h-full w-full items-center justify-center bg-primary-container text-on-primary-container">
        <M3Icon name="restaurant" :size="64" />
      </div>
    </div>
    <div class="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
      <Badge v-if="categoryName" variant="secondary" class="shadow-m3-1">
        {{ categoryName }}
      </Badge>
      <span v-else />
      <Badge v-if="featured" class="shadow-m3-1">Featured</Badge>
    </div>
  </div>
</template>
