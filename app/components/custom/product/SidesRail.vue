<script setup lang="ts">
import { toast } from "vue-sonner";
import M3Icon from "@/components/M3Icon.vue";
import { formatNaira } from "~~/shared/utils/pricing";

/* Single responsibility: "complete your meal" add-on rail.
   Sides arrive via props; each row quick-adds its cheapest
   variant — sides are ordinary cart lines, so they also work
   alone from the menu page. Renders nothing when empty. */

interface Props {
  products: Array<Record<string, any>>;
}

defineProps<Props>();

const { addItem } = useCart();

function cheapest(side: Record<string, any>) {
  const variants = [...(side.variants ?? [])].sort(
    (a: any, b: any) => Number(a.price) - Number(b.price),
  );
  return variants[0] ?? null;
}

const addedId = ref<string | number | null>(null);

function quickAdd(side: Record<string, any>) {
  const variant = cheapest(side);
  if (!variant) {
    navigateTo(`/product/${side.id}`);
    return;
  }
  addItem({
    variantId: variant.id,
    quantity: 1,
    snapshot: {
      variantId: variant.id,
      productName: side.name,
      variantName: variant.name,
      sku: variant.sku,
      price: variant.price,
      imageUrl: side.imageUrl,
    },
  });
  addedId.value = side.id;
  toast.success(`${side.name} added to cart`);
  setTimeout(() => {
    if (addedId.value === side.id) addedId.value = null;
  }, 1500);
}
</script>

<template>
  <section v-if="products.length" class="mt-12">
    <p class="text-xs font-medium uppercase tracking-[0.3em] text-primary">Sides</p>
    <h2 class="m3-headline-md mt-2">Complete your meal</h2>
    <ul class="mt-6 grid gap-3 sm:grid-cols-2">
      <li
        v-for="side in products"
        :key="side.id"
        class="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
      >
        <NuxtLink
          :to="`/product/${side.id}`"
          :aria-label="side.name"
          class="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <img
            v-if="side.imageUrl"
            :src="side.imageUrl"
            :alt="side.name"
            loading="lazy"
            class="h-full w-full object-cover"
          />
          <span v-else class="flex h-full w-full items-center justify-center bg-primary-container text-on-primary-container">
            <M3Icon name="restaurant" :size="24" />
          </span>
        </NuxtLink>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold">{{ side.name }}</p>
          <p v-if="cheapest(side)" class="mt-0.5 text-sm text-primary">
            {{ formatNaira(Number(cheapest(side).price)) }}
            <span class="text-xs text-muted-foreground">· {{ cheapest(side).name }}</span>
          </p>
        </div>
        <button
          type="button"
          :aria-label="addedId === side.id ? 'Added to cart' : `Add ${side.name} to cart`"
          class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container shadow-m3-1 transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          @click="quickAdd(side)"
        >
          <M3Icon :name="addedId === side.id ? 'check' : 'add'" :size="20" />
        </button>
      </li>
    </ul>
  </section>
</template>
