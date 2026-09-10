<script setup lang="ts">
/* Single responsibility: mobile sticky buy bar.
   Visibility is decided by the page (sentinel observer);
   this component only renders price + action. */

interface Props {
  visible: boolean;
  totalLabel: string;
  canBuy: boolean;
}

defineProps<Props>();
const emit = defineEmits<{
  add: [];
}>();
</script>

<template>
  <Transition
    enter-active-class="transition duration-300"
    enter-from-class="translate-y-full"
    enter-to-class="translate-y-0"
    leave-active-class="transition duration-200"
    leave-from-class="translate-y-0"
    leave-to-class="translate-y-full"
  >
    <div
      v-if="visible"
      class="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface-container px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-m3-3 md:hidden"
    >
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="m3-label-sm text-muted-foreground">Total</p>
          <p class="m3-title-lg text-foreground">{{ totalLabel }}</p>
        </div>
        <button
          type="button"
          :disabled="!canBuy"
          class="rounded-full bg-primary px-8 py-3 text-xs font-medium uppercase tracking-widest text-primary-foreground shadow-m3-2 transition-colors hover:bg-primary/90 disabled:opacity-50"
          @click="emit('add')"
        >
          Add to cart
        </button>
      </div>
    </div>
  </Transition>
</template>
