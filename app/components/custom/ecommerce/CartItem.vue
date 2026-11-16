<script setup lang="ts">
import M3Icon from "@/components/M3Icon.vue";
import { formatNaira } from "~~/shared/utils/pricing";
import type { CartRow } from "~/composables/cart/types";

/* One cart line: photo, name, size, stepper, line total.
   At quantity 1 the minus button becomes a bin — no dead buttons. */

const NuxtLink = resolveComponent("NuxtLink");
const props = defineProps<{ item: CartRow; compact?: boolean }>();
const emit = defineEmits<{ update: [qty: number]; remove: [] }>();

const unit = computed(() => Number(props.item.price ?? 0));
const lineTotal = computed(() => unit.value * props.item.quantity);
const productLink = computed(() => (props.item.productId ? `/product/${props.item.productId}` : undefined));
</script>

<template>
  <div class="flex gap-3 rounded-2xl border border-border bg-card p-3">
    <component
      :is="productLink ? NuxtLink : 'div'"
      :to="productLink"
      class="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted"
      :aria-label="productLink ? `View ${item.name}` : undefined"
    >
      <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" class="h-full w-full object-cover" loading="lazy" />
      <M3Icon v-else name="restaurant" :size="28" class="text-muted-foreground" />
    </component>

    <div class="flex min-w-0 flex-1 flex-col">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <p class="truncate font-medium text-foreground">{{ item.name || "Item" }}</p>
          <p class="text-sm text-muted-foreground">
            {{ item.variantName }}<span v-if="item.variantName"> · </span>{{ formatNaira(unit) }} each
          </p>
        </div>
        <button
          type="button"
          class="-mr-1 -mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          :aria-label="`Remove ${item.name} from cart`"
          @click="emit('remove')"
        >
          <M3Icon name="close" :size="18" />
        </button>
      </div>

      <div class="mt-auto flex items-center justify-between gap-2 pt-2">
        <div class="inline-flex items-center rounded-full border border-border" role="group" :aria-label="`Quantity of ${item.name}`">
          <button
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-secondary-container/60"
            :aria-label="item.quantity > 1 ? 'Decrease quantity' : `Remove ${item.name}`"
            @click="item.quantity > 1 ? emit('update', item.quantity - 1) : emit('remove')"
          >
            <M3Icon :name="item.quantity > 1 ? 'remove' : 'delete'" :size="18" />
          </button>
          <span class="min-w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">{{ item.quantity }}</span>
          <button
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-secondary-container/60 disabled:opacity-40"
            aria-label="Increase quantity"
            :disabled="item.quantity >= 99"
            @click="emit('update', item.quantity + 1)"
          >
            <M3Icon name="add" :size="18" />
          </button>
        </div>
        <p class="font-semibold tabular-nums">{{ formatNaira(lineTotal) }}</p>
      </div>
    </div>
  </div>
</template>
