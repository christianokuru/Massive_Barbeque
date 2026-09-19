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

// Clamp typed input to sane integers — raw v-model values (0, -5,
// NaN, 999999) must never reach the cart.
function commitQty() {
  const n = Number(qty.value);
  const clamped = !Number.isFinite(n) ? 1 : Math.min(99, Math.max(1, Math.floor(n)));
  qty.value = clamped;
  emit("update", clamped);
}

const lineTotal = computed(() => Number(props.item.price ?? 0) * props.item.quantity);
const formatNaira = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
</script>

<template>
  <div class="flex gap-4 rounded-lg border border-border bg-card p-4">
    <div class="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded bg-muted">
      <img
        v-if="item.imageUrl"
        :src="item.imageUrl"
        :alt="item.name"
        class="h-full w-full object-cover"
      />
      <span v-else class="text-2xl">🔥</span>
    </div>
    <div class="min-w-0 flex-1">
      <p class="truncate font-medium text-foreground">{{ item.name }}</p>
      <p class="text-sm text-muted-foreground">{{ item.variantName }} · {{ item.sku }}</p>
      <div class="mt-2 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <button
            class="rounded border border-border px-2 py-1 text-sm"
            @click="qty > 1 && emit('update', qty - 1)"
          >
            −
          </button>
          <input
            v-model.number="qty"
            type="number"
            min="1"
            max="99"
            class="w-14 rounded border border-border px-2 py-1 text-center text-sm"
            @change="commitQty"
          />
          <button class="rounded border border-border px-2 py-1 text-sm" @click="emit('update', qty + 1)">
            +
          </button>
        </div>
        <p class="text-sm font-semibold">{{ formatNaira(lineTotal) }}</p>
      </div>
      <button class="mt-2 text-xs text-destructive hover:underline" @click="emit('remove')">
        Remove
      </button>
    </div>
  </div>
</template>
