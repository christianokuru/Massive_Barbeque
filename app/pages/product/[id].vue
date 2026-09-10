<script setup lang="ts">
import { toast } from "vue-sonner";
import ProductGallery from "@/components/custom/product/ProductGallery.vue";
import ProductBreadcrumb from "@/components/custom/product/ProductBreadcrumb.vue";
import VariantPicker from "@/components/custom/product/VariantPicker.vue";
import QtyStepper from "@/components/custom/product/QtyStepper.vue";
import StockStatus from "@/components/custom/product/StockStatus.vue";
import DeliveryStrip from "@/components/custom/product/DeliveryStrip.vue";
import StickyBuyBar from "@/components/custom/product/StickyBuyBar.vue";
import RelatedRail from "@/components/custom/product/RelatedRail.vue";
import ProductNotFound from "@/components/custom/product/ProductNotFound.vue";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNaira, lineTotal } from "~~/shared/utils/pricing";

/* Thin composer: data + buy state live here; every section below
   is a prop-driven component that owns its own presentation. */

const route = useRoute();
const productId = computed(() => String(route.params.id));
const { addItem } = useCart();

const selectedVariantId = ref<string | number | null>(null);
const qty = ref(1);
const showBar = ref(false);

const { data: product, pending, error } = await useAsyncData(
  () => `product-${productId.value}`,
  () =>
    $fetch<{ product: any }>(`/api/products/${productId.value}`).then(
      (r) => r.product,
    ),
  { watch: [productId] },
);

watchEffect(() => {
  const first = product.value?.variants?.[0];
  if (first && selectedVariantId.value === null) {
    selectedVariantId.value = first.id;
  }
  if (!product.value) selectedVariantId.value = null;
});

const variants = computed(() => product.value?.variants ?? []);
const selectedVariant = computed(
  () => variants.value.find((v: any) => v.id === selectedVariantId.value) ?? null,
);
const canBuy = computed(
  () => !!selectedVariant.value && Number(selectedVariant.value.inventoryQty ?? 1) > 0,
);
const total = computed(() =>
  lineTotal(selectedVariant.value?.price ?? 0, qty.value),
);

const crumbs = computed(() => [
  { label: "Home", to: "/" },
  { label: "Menu", to: "/menu" },
  { label: product.value?.name ?? "Product" },
]);

const deliveryInfo = [
  { icon: "delivery_dining", title: "₦2,000 delivery", text: "Hot across Lagos" },
  { icon: "storefront", title: "Free pickup", text: "Grab it fresh" },
  { icon: "schedule", title: "Grilled to order", text: "Made when you order" },
];

/* Related rail: same category, excluding the current product. */
const { data: related } = await useAsyncData(
  () => `related-${product.value?.category?.id ?? "none"}-${productId.value}`,
  async () => {
    const categoryId = product.value?.category?.id;
    if (!categoryId) return [];
    try {
      const r = await $fetch<{ products: any[] }>("/api/products", {
        params: { categoryId, limit: 5 },
      });
      return (r.products ?? [])
        .filter((p: any) => String(p.id) !== productId.value)
        .slice(0, 4);
    } catch {
      return [];
    }
  },
  { watch: [product] },
);

useSeoMeta({
  title: () => (product.value ? `${product.value.name} | Massive Barbeque` : "Product | Massive Barbeque"),
  description: () => product.value?.description ?? "Order premium BBQ in Lagos.",
  ogTitle: () => (product.value ? `${product.value.name} | Massive Barbeque` : "Massive Barbeque"),
  ogDescription: () => product.value?.description ?? "Order premium BBQ in Lagos.",
  ogImage: () => product.value?.imageUrl ?? "/og-image.png",
});

/* Instant add: the store applies optimistically and syncs in the
   background — no awaiting, the toast fires immediately. */
function addToCart() {
  if (!selectedVariant.value) {
    toast.error("Please select a size first.");
    return;
  }
  const variant = selectedVariant.value;
  addItem({
    variantId: variant.id,
    quantity: qty.value,
    snapshot: {
      variantId: variant.id,
      productName: product.value.name,
      variantName: variant.name,
      sku: variant.sku,
      price: variant.price,
      imageUrl: product.value.imageUrl,
    },
  });
  toast.success(`${product.value.name} added to cart`);
}

/* Sticky bar appears once the main buy box scrolls out of view. */
const sentinel = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

onMounted(() => {
  observer = new IntersectionObserver(
    ([entry]) => {
      showBar.value = !entry.isIntersecting && !!product.value;
    },
    { threshold: 0 },
  );
  if (sentinel.value) observer.observe(sentinel.value);
});

onUnmounted(() => observer?.disconnect());
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-20 sm:py-24 md:px-6">
    <ProductBreadcrumb :items="crumbs" />

    <!-- Loading skeleton mirrors the loaded layout -->
    <div v-if="pending" class="mt-6 grid gap-8 md:grid-cols-2" aria-label="Loading product">
      <Skeleton class="aspect-[4/3] w-full rounded-xl" />
      <div class="space-y-3">
        <Skeleton class="h-9 w-3/4" />
        <Skeleton class="h-4 w-full" />
        <Skeleton class="h-4 w-2/3" />
        <Skeleton class="h-11 w-1/2 rounded-full" />
        <Skeleton class="h-12 w-full rounded-full" />
      </div>
    </div>

    <ProductNotFound v-else-if="error || !product" />

    <div v-else class="mt-6 grid items-start gap-8 md:grid-cols-2">
      <ProductGallery
        :image-url="product.imageUrl"
        :name="product.name"
        :category-name="product.category?.name"
        :featured="product.featured"
      />

      <div>
        <p v-if="product.category?.name" class="text-xs font-medium uppercase tracking-[0.3em] text-primary">
          {{ product.category.name }}
        </p>
        <h1 class="m3-headline-lg mt-2 text-foreground sm:m3-display-sm">{{ product.name }}</h1>
        <p class="m3-display-sm mt-3 text-primary">{{ formatNaira(total) }}</p>
        <p v-if="product.description" class="m3-body-md mt-3 text-muted-foreground">
          {{ product.description }}
        </p>

        <div class="mt-6 space-y-5">
          <StockStatus :qty="selectedVariant?.inventoryQty" />
          <VariantPicker
            v-if="variants.length"
            :variants="variants"
            :model-value="selectedVariantId"
            @update:model-value="selectedVariantId = $event"
          />
          <p v-else class="m3-body-sm text-muted-foreground">
            This item isn't orderable online yet — check back soon.
          </p>
          <QtyStepper v-model="qty" />
          <div ref="sentinel" class="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              :disabled="!canBuy"
              class="rounded-full bg-primary px-8 py-3 text-xs font-medium uppercase tracking-widest text-primary-foreground shadow-m3-2 transition-colors hover:bg-primary/90 disabled:opacity-50 sm:flex-1"
              @click="addToCart"
            >
              Add to cart
            </button>
            <NuxtLink
              to="/checkout"
              class="rounded-full border border-border px-8 py-3 text-center text-xs font-medium uppercase tracking-widest text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Checkout
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <div v-if="product" class="mt-12">
      <DeliveryStrip :items="deliveryInfo" />
    </div>

    <RelatedRail title="Pairs well with" :products="related ?? []" />

    <StickyBuyBar
      :visible="showBar && !pending"
      :total-label="formatNaira(total)"
      :can-buy="canBuy"
      @add="addToCart"
    />
  </div>
</template>
