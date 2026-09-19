<script setup lang="ts">
import M3Icon from "@/components/M3Icon.vue";
import { Badge } from "@/components/ui/badge";

/* Product media: cover photo plus optional extra gallery images.
   Thumbnails let the customer flip through every angle. Tile fallback
   matches ProductCard when a food has no photos at all. */

interface GalleryImage {
  id?: number
  imageUrl: string
}

interface Props {
  imageUrl?: string | null;
  images?: GalleryImage[];
  name: string;
  categoryName?: string | null;
  featured?: boolean;
}

const props = defineProps<Props>();

const allImages = computed(() => {
  const list: string[] = [];
  if (props.imageUrl) list.push(props.imageUrl);
  for (const img of props.images ?? []) {
    if (img.imageUrl && !list.includes(img.imageUrl)) list.push(img.imageUrl);
  }
  return list;
});

const activeIndex = ref(0);
watch(allImages, () => {
  activeIndex.value = 0;
});
const activeImage = computed(() => allImages.value[activeIndex.value] ?? null);
</script>

<template>
  <div>
    <div class="relative overflow-hidden rounded-xl border border-border bg-muted">
      <div class="flex aspect-[4/3] items-center justify-center overflow-hidden">
        <img
          v-if="activeImage"
          :src="activeImage"
          :alt="name"
          class="h-full w-full object-cover"
        />
        <div v-else class="flex h-full w-full items-center justify-center bg-primary-container text-on-primary-container">
          <M3Icon name="restaurant" :size="64" />
        </div>
      </div>
      <div class="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
        <Badge v-if="categoryName" variant="secondary">
          {{ categoryName }}
        </Badge>
        <span v-else />
        <Badge v-if="featured">Featured</Badge>
      </div>
    </div>
    <div v-if="allImages.length > 1" class="mt-3 grid grid-cols-5 gap-2">
      <button
        v-for="(src, i) in allImages"
        :key="`${i}-${src}`"
        type="button"
        class="aspect-square overflow-hidden rounded-lg border bg-muted transition-colors"
        :class="i === activeIndex ? 'border-primary ring-2 ring-primary/40' : 'border-border hover:border-primary/60'"
        :aria-label="`View photo ${i + 1} of ${name}`"
        :aria-pressed="i === activeIndex"
        @click="activeIndex = i"
      >
        <img :src="src" :alt="`${name} photo ${i + 1}`" class="h-full w-full object-cover" loading="lazy" />
      </button>
    </div>
  </div>
</template>
