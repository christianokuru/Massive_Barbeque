<script setup lang="ts">
const route = useRoute();
const { addItem } = useCart();
const selectedVariant = ref<any>(null);
const qty = ref(1);
const adding = ref(false);
const message = ref("");

const { data: product, error } = await useAsyncData(`product-${route.params.id}`, () =>
  $fetch<{ product: any }>(`/api/products/${route.params.id}`).then((r) => r.product)
);

watchEffect(() => {
  if (product.value?.variants?.length && !selectedVariant.value) {
    selectedVariant.value = product.value.variants[0];
  }
});

useSeoMeta({
  title: () => (product.value ? `${product.value.name} | Massive Barbeque` : "Product | Massive Barbeque"),
});

const formatNaira = (n: number | string) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(Number(n));

async function addToCart() {
  if (!selectedVariant.value) {
    message.value = "Please select a size.";
    return;
  }
  adding.value = true;
  message.value = "";
  try {
    await addItem(selectedVariant.value.id, qty.value);
    message.value = "Added to cart.";
  } catch {
    message.value = "Could not add to cart. Try again.";
  } finally {
    adding.value = false;
  }
}
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-24 md:px-6">
    <NuxtLink to="/menu" class="text-sm text-gray-500 hover:underline">← Back to menu</NuxtLink>
    <p v-if="error" class="mt-6 text-red-600">Product not found.</p>
    <div v-else-if="product" class="mt-6 grid gap-8 md:grid-cols-2">
      <div class="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-6xl">
        <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name" class="h-full w-full object-cover" />
        <span v-else>🔥</span>
      </div>
      <div>
        <p v-if="product.category?.name" class="text-xs uppercase tracking-wider text-gray-500">{{ product.category.name }}</p>
        <h1 class="mt-1 text-3xl font-bold md:text-4xl">{{ product.name }}</h1>
        <p class="mt-3 text-gray-600">{{ product.description }}</p>
        <div v-if="product.variants?.length" class="mt-6">
          <p class="mb-2 text-sm font-medium">Choose size</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="v in product.variants"
              :key="v.id"
              :class="selectedVariant?.id === v.id ? 'border-black bg-black text-white' : 'border-gray-300 bg-white'"
              class="rounded border px-4 py-2 text-sm"
              @click="selectedVariant = v"
            >
              {{ v.name }} · {{ formatNaira(v.price) }}
            </button>
          </div>
          <div class="mt-4 flex items-center gap-3">
            <input v-model.number="qty" type="number" min="1" class="w-20 rounded border border-gray-300 px-3 py-2" />
            <button :disabled="adding" class="rounded bg-[#FF6B35] px-6 py-2 font-medium text-white disabled:opacity-50" @click="addToCart">
              {{ adding ? "Adding…" : "Add to cart" }}
            </button>
            <NuxtLink to="/cart" class="rounded border border-gray-300 px-6 py-2">View cart</NuxtLink>
          </div>
          <p v-if="message" class="mt-2 text-sm text-gray-600">{{ message }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
