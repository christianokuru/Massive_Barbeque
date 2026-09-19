<script setup lang="ts">
import { toast } from "vue-sonner";
import ProductGallery from "@/components/custom/product/ProductGallery.vue";
import ProductBreadcrumb from "@/components/custom/product/ProductBreadcrumb.vue";
import VariantPicker from "@/components/custom/product/VariantPicker.vue";
import DeliveryStrip from "@/components/custom/product/DeliveryStrip.vue";
import StickyBuyBar from "@/components/custom/product/StickyBuyBar.vue";
import RelatedRail from "@/components/custom/product/RelatedRail.vue";
import SidesRail from "@/components/custom/product/SidesRail.vue";
import ProductNotFound from "@/components/custom/product/ProductNotFound.vue";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNaira, lineTotal } from "~~/shared/utils/pricing";

/* Thin composer: data + buy state live here; every section below
   is a prop-driven component that owns its own presentation. */

const route = useRoute();
const productId = computed(() => String(route.params.id));
const { addItem } = useCart();

/* Multi-select sizes: quantities keyed by variant id ("3" -> 3×Regular).
   Absent/zero means that size isn't ordered. Reset on navigation. */
const quantities = ref<Record<string, number>>({});
const showBar = ref(false);

const { data: product, pending, error } = await useAsyncData(
  () => `product-${productId.value}`,
  () =>
    $fetch<{ product: any }>(`/api/products/${productId.value}`).then(
      (r) => r.product,
    ),
  { watch: [productId] },
);

watch(productId, () => {
  // Drop staged quantities when navigating between products.
  quantities.value = {};
});

const variants = computed(() => product.value?.variants ?? []);

/* Order lines: selected variants (qty > 0), clamped to available stock
   at add time in case stock moved since the page loaded. */
const lines = computed(() =>
  variants.value
    .map((v: any) => {
      const wanted = Math.max(0, Math.floor(Number(quantities.value[String(v.id)] ?? 0)));
      const stock = v.inventoryQty === null || v.inventoryQty === undefined || v.inventoryQty === ""
        ? Number.POSITIVE_INFINITY
        : Number(v.inventoryQty);
      return { variant: v, qty: Math.min(wanted, Number.isFinite(stock) ? Math.max(stock, 0) : 99) };
    })
    .filter((l) => l.qty > 0),
);
const canBuy = computed(() => lines.value.length > 0);
const total = computed(() =>
  lines.value.reduce((sum, l) => sum + Number(lineTotal(l.variant.price ?? 0, l.qty)), 0),
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

/* Sides add-on rail: every BBQ pairs with sides. Hidden on side
   products themselves (the related rail already covers those). */
const isSideProduct = computed(() => product.value?.category?.slug === "sides");

const { data: sides } = await useAsyncData(
  () => `sides-rail-${productId.value}`,
  async () => {
    if (isSideProduct.value) return [];
    try {
      const { categories } = await $fetch<{ categories: any[] }>("/api/categories");
      const sidesCat = (categories ?? []).find((c: any) => c.slug === "sides");
      if (!sidesCat) return [];
      const r = await $fetch<{ products: any[] }>("/api/products", {
        params: { categoryId: sidesCat.id, limit: 8 },
      });
      return (r.products ?? []).filter((p: any) => String(p.id) !== productId.value);
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

/* Instant add: every selected size goes in as its own cart line in one
   go — the toast fires immediately, the store syncs in the background. */
function addToCart() {
  if (!lines.value.length) {
    toast.error("Choose at least one size first.");
    return;
  }
  for (const { variant, qty } of lines.value) {
    addItem({
      variantId: variant.id,
      quantity: qty,
      snapshot: {
        variantId: variant.id,
        productName: product.value.name,
        variantName: variant.name,
        sku: variant.sku,
        price: variant.price,
        imageUrl: product.value.imageUrl,
      },
    });
  }
  const summary = lines.value.map((l) => `${l.qty}× ${l.variant.name}`).join(" + ");
  toast.success(`${product.value.name} (${summary}) added to cart`);
  quantities.value = {};
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
        :images="product.images ?? []"
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
          <VariantPicker
            v-if="variants.length"
            :variants="variants"
            :quantities="quantities"
            @update:quantities="quantities = $event"
          />
          <p v-else class="m3-body-sm text-muted-foreground">
            This item isn't orderable online yet — check back soon.
          </p>
          <div ref="sentinel" class="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              :disabled="!canBuy"
              class="rounded-full bg-primary px-8 py-3 text-xs font-medium uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 sm:flex-1"
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

    <SidesRail v-if="!isSideProduct" :products="sides ?? []" />

    <RelatedRail title="Pairs well with" :products="related ?? []" />

    <StickyBuyBar
      :visible="showBar && !pending"
      :total-label="formatNaira(total)"
      :can-buy="canBuy"
      @add="addToCart"
    />
  </div>
</template>
