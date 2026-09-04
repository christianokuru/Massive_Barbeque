<script setup lang="ts">
const props = defineProps({
  item: { type: Object, required: true },
});
const emit = defineEmits(["update", "remove"]);

const qty = ref(props.item.quantity);
watch(
  () => props.item.quantity,
  (v) => (qty.value = v)
);

const lineTotal = computed(() => Number(props.item.variant?.price ?? 0) * props.item.quantity);
const formatNaira = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
</script>

<template>
  <div class="flex gap-4 rounded-lg border border-gray-200 bg-white p-4">
    <div class="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded bg-gray-100">
      <img
        v-if="item.variant?.product?.imageUrl"
        :src="item.variant.product.imageUrl"
        :alt="item.variant.product.name"
        class="h-full w-full object-cover"
      />
      <span v-else class="text-2xl">🔥</span>
    </div>
    <div class="min-w-0 flex-1">
      <p class="truncate font-medium text-gray-900">{{ item.variant?.product?.name }}</p>
      <p class="text-sm text-gray-500">{{ item.variant?.name }} · {{ item.variant?.sku }}</p>
      <div class="mt-2 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <button
            class="rounded border border-gray-300 px-2 py-1 text-sm"
            @click="qty > 1 && emit('update', qty - 1)"
          >
            −
          </button>
          <input
            v-model.number="qty"
            type="number"
            min="1"
            class="w-14 rounded border border-gray-300 px-2 py-1 text-center text-sm"
            @change="emit('update', qty)"
          />
          <button class="rounded border border-gray-300 px-2 py-1 text-sm" @click="emit('update', qty + 1)">
            +
          </button>
        </div>
        <p class="text-sm font-semibold">{{ formatNaira(lineTotal) }}</p>
      </div>
      <button class="mt-2 text-xs text-red-600 hover:underline" @click="emit('remove')">
        Remove
      </button>
    </div>
  </div>
</template>
