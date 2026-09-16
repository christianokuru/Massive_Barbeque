<script setup lang="ts">
import { toast } from "vue-sonner";
import { Star } from "lucide-vue-next";
import M3Icon from "@/components/M3Icon.vue";
import { Badge } from "@/components/ui/badge";

/* Single responsibility: menu product card.
   Product arrives via props; card owns presentation + quick-add only.
   Media and title link to the detail page; quick-add is a sibling
   action (never nested inside the link) for valid semantics. */

const props = defineProps({
  product: { type: Object, required: true },
  /** Compact variant for dense rails (homepage): tighter padding,
      smaller type, shorter media. Menu page uses full size. */
  compact: { type: Boolean, default: false },
  /** Showcase variant (homepage rail): image-dominant card modeled on
      the reference — full-bleed photo, scrim, name overlay, tiny
      quick-add. No badges or description so the food sells itself. */
  showcase: { type: Boolean, default: false },
});

const { addItem } = useCart();

const lowestPrice = computed(() => {
  const variants = props.product.variants ?? [];
  if (!variants.length) return null;
  return Math.min(...variants.map((v: any) => Number(v.price)));
});

const detailTo = computed(() => `/product/${props.product.id}`);

/* Showcase stars: rendered only when the product carries a rating
   (0–5). No rating data → no stars, never faked. */
const starCount = computed(() => {
  const rating = Number(props.product.rating);
  if (!Number.isFinite(rating) || rating <= 0) return 0;
  return Math.min(5, Math.round(rating));
});

const formatNaira = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

const added = ref(false);

/* Instant add: the store applies optimistically and syncs in the
   background, so the toast fires immediately — no awaiting. */
function quickAdd() {
  const variants = [...(props.product.variants ?? [])].sort(
    (a: any, b: any) => Number(a.price) - Number(b.price),
  );
  if (!variants.length) {
    navigateTo(detailTo.value);
    return;
  }
  const cheapest = variants[0];
  addItem({
    variantId: cheapest.id,
    quantity: 1,
    snapshot: {
      variantId: cheapest.id,
      productName: props.product.name,
      variantName: cheapest.name,
      sku: cheapest.sku,
      price: cheapest.price,
      imageUrl: props.product.imageUrl,
    },
  });
  added.value = true;
  toast.success(`${props.product.name} added to cart`);
  setTimeout(() => (added.value = false), 1500);
}
</script>

<template>
  <!-- Showcase: image-dominant rail card (see reference middle frame) -->
  <article
    v-if="showcase"
    class="group relative overflow-hidden rounded-xl bg-muted transition-shadow"
  >
    <NuxtLink
      :to="detailTo"
      :aria-label="product.name"
      class="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
    >
      <div class="aspect-[4/5] w-full overflow-hidden">
        <img
          v-if="product.imageUrl"
          :src="product.imageUrl"
          :alt="product.name"
          loading="lazy"
          class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div v-else class="flex h-full w-full items-center justify-center bg-primary-container text-on-primary-container">
          <M3Icon name="restaurant" :size="40" />
        </div>
      </div>
      <!-- Scrim + overlay -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" aria-hidden="true" />
      <div class="absolute inset-x-0 bottom-0 p-3 pr-12">
        <div v-if="starCount > 0" class="mb-1 flex items-center gap-0.5" :aria-label="`Rated ${starCount} out of 5`">
          <Star
            v-for="n in 5"
            :key="n"
            :class="[
              'h-3 w-3',
              n <= starCount ? 'fill-amber-400 text-amber-400' : 'text-white/40',
            ]"
          />
        </div>
        <h3 class="truncate text-sm font-bold uppercase tracking-wide text-white">{{ product.name }}</h3>
        <p v-if="lowestPrice !== null" class="mt-0.5 text-xs font-medium text-white/80">
          From {{ formatNaira(lowestPrice) }}
        </p>
      </div>
    </NuxtLink>
    <!-- Tiny quick-add: 32px visual, 48px hit area via hit-slop -->
    <button
      type="button"
      :aria-label="added ? 'Added to cart' : `Quick add ${product.name} to cart`"
      class="absolute right-2.5 bottom-2.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform after:absolute after:-inset-2 after:content-[''] hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      @click="quickAdd"
    >
      <M3Icon :name="added ? 'check' : 'add_shopping_cart'" :size="16" />
    </button>
  </article>

  <article
    v-else
    class="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow"
  >
    <!-- Media -->
    <NuxtLink :to="detailTo" :aria-label="product.name" class="relative block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
      <div :class="['w-full overflow-hidden bg-muted', compact ? 'aspect-[16/10]' : 'aspect-[4/3]']">
        <img
          v-if="product.imageUrl"
          :src="product.imageUrl"
          :alt="product.name"
          loading="lazy"
          class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
        />
        <div v-else class="flex h-full w-full items-center justify-center bg-primary-container text-on-primary-container">
          <M3Icon name="restaurant" :size="compact ? 32 : 44" />
        </div>
      </div>
      <div :class="['absolute flex items-start justify-between gap-2', compact ? 'inset-x-2 top-2' : 'inset-x-3 top-3']">
        <Badge v-if="product.category?.name" variant="secondary">
          {{ product.category.name }}
        </Badge>
        <span v-else />
        <Badge v-if="product.featured">Featured</Badge>
      </div>
    </NuxtLink>

    <!-- Body -->
    <div :class="['flex flex-1 flex-col', compact ? 'p-3' : 'p-4']">
      <NuxtLink :to="detailTo" class="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <h3 :class="compact ? 'm3-title-sm line-clamp-1 text-foreground' : 'm3-title-md text-foreground'">{{ product.name }}</h3>
      </NuxtLink>
      <p v-if="product.description && !compact" class="m3-body-sm mt-1 line-clamp-2 text-muted-foreground">
        {{ product.description }}
      </p>
      <div class="mt-auto flex items-center justify-between gap-2 pt-2">
        <p v-if="lowestPrice !== null" :class="compact ? 'm3-title-sm text-primary' : 'm3-title-md text-primary'">
          From {{ formatNaira(lowestPrice) }}
        </p>
        <p v-else class="m3-body-sm text-muted-foreground">Price on request</p>
        <button
          type="button"
          :aria-label="added ? 'Added to cart' : `Quick add ${product.name} to cart`"
          :class="[
            'inline-flex shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60',
            compact ? 'h-10 w-10' : 'h-11 w-11',
          ]"
          @click="quickAdd"
        >
          <M3Icon :name="added ? 'check' : 'add_shopping_cart'" :size="compact ? 19 : 22" />
        </button>
      </div>
    </div>
  </article>
</template>
