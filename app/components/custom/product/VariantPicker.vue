<script setup lang="ts">
import M3Icon from "@/components/M3Icon.vue";
import { formatNaira } from "~~/shared/utils/pricing";
import { cn } from "@/lib/utils";

/* Single responsibility: multi-select size pills with per-pill steppers.
   Tapping a pill selects that size (stepper appears, starting at 1);
   tapping again deselects it (stepper disappears). Quantities arrive via
   v-model as a record keyed by variant id — absent/zero = not selected. */

export interface VariantOption {
  id: string | number;
  name: string;
  price: string | number;
  inventoryQty?: number | string | null;
}

interface Props {
  variants: VariantOption[];
  quantities: Record<string, number>;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  "update:quantities": [value: Record<string, number>];
}>();

const CART_MAX = 99;

function keyOf(id: string | number) {
  return String(id);
}

function stockOf(v: VariantOption): number | null {
  if (v.inventoryQty === null || v.inventoryQty === undefined || v.inventoryQty === "") return null;
  const n = Number(v.inventoryQty);
  return Number.isFinite(n) ? n : null;
}

function maxFor(v: VariantOption) {
  const stock = stockOf(v);
  return stock === null ? CART_MAX : Math.min(Math.max(stock, 1), CART_MAX);
}

function isSoldOut(v: VariantOption) {
  const stock = stockOf(v);
  return stock !== null && stock <= 0;
}

function qtyOf(v: VariantOption) {
  return props.quantities[keyOf(v.id)] ?? 0;
}

function toggle(v: VariantOption) {
  if (isSoldOut(v)) return;
  const next = { ...props.quantities };
  if (qtyOf(v) > 0) delete next[keyOf(v.id)];
  else next[keyOf(v.id)] = 1;
  emit("update:quantities", next);
}

function setQty(v: VariantOption, qty: number, event: Event) {
  event.stopPropagation();
  const next = Math.min(Math.max(1, Math.floor(qty) || 1), maxFor(v));
  emit("update:quantities", { ...props.quantities, [keyOf(v.id)]: next });
}

const single = computed(() => props.variants.length === 1);
</script>

<template>
  <div>
    <p class="m3-label-lg text-foreground">
      {{ single ? "Size" : "Choose sizes" }}
    </p>
    <div role="group" aria-label="Choose sizes" class="mt-2 flex flex-wrap gap-2">
      <span
        v-for="v in variants"
        :key="v.id"
        :class="cn(
          'inline-flex max-w-full items-center gap-2 rounded-full border transition-colors',
          qtyOf(v) > 0
            ? 'border-primary bg-secondary-container text-on-secondary-container'
            : 'border-border bg-card text-foreground',
          !isSoldOut(v) && qtyOf(v) === 0 && 'hover:border-primary',
          isSoldOut(v) && 'opacity-50',
        )"
      >
        <button
          type="button"
          role="checkbox"
          :aria-checked="qtyOf(v) > 0"
          :disabled="isSoldOut(v)"
          class="inline-flex items-center gap-2 rounded-full py-2 pr-1 pl-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed"
          :class="qtyOf(v) > 0 ? '' : 'pr-4'"
          @click="toggle(v)"
        >
          <M3Icon v-if="qtyOf(v) > 0" name="check" :size="18" />
          {{ v.name }} · {{ formatNaira(v.price) }}
          <span v-if="isSoldOut(v)" class="text-xs opacity-70">· Sold out</span>
        </button>
        <span v-if="qtyOf(v) > 0" class="inline-flex items-center gap-0.5 pr-1">
          <button
            type="button"
            :aria-label="`Remove one ${v.name}`"
            :disabled="qtyOf(v) <= 1"
            class="inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
            @click="setQty(v, qtyOf(v) - 1, $event)"
          >
            <M3Icon name="remove" :size="16" />
          </button>
          <span class="w-6 text-center text-sm font-semibold tabular-nums" aria-live="polite">
            {{ qtyOf(v) }}
          </span>
          <button
            type="button"
            :aria-label="`Add one ${v.name}`"
            :disabled="qtyOf(v) >= maxFor(v)"
            class="inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
            @click="setQty(v, qtyOf(v) + 1, $event)"
          >
            <M3Icon name="add" :size="16" />
          </button>
        </span>
      </span>
    </div>
  </div>
</template>
