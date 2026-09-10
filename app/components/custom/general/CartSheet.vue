<script setup lang="ts">
import CartItem from "@/components/custom/ecommerce/CartItem.vue";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

/* Single responsibility: mini-cart drawer.
   Reads local cart state via useCart (synchronous — renders instantly,
   no loading state); open state is controlled by the parent (Navbar). */

const props = defineProps<{ open: boolean }>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  close: [];
}>();

const { items, count, subtotal, updateItem, removeItem } = useCart();
const route = useRoute();

function setOpen(value: boolean) {
  emit("update:open", value);
  if (!value) emit("close");
}

watch(() => route.fullPath, () => {
  if (props.open) setOpen(false);
});
</script>

<template>
  <Sheet :open="open" @update:open="setOpen">
    <SheetContent side="right" class="w-[min(94vw,400px)] p-0 sm:max-w-md">
      <SheetHeader class="border-b border-border p-4 text-left">
        <SheetTitle>Your cart{{ count > 0 ? ` (${count})` : "" }}</SheetTitle>
        <SheetDescription>
          {{ count > 0 ? "Review your items before checkout." : "Your cart is currently empty." }}
        </SheetDescription>
      </SheetHeader>

      <div class="flex-1 overflow-y-auto p-4">
        <div v-if="items.length" class="space-y-3">
          <CartItem
            v-for="(item, i) in items"
            :key="item.id"
            :item="item"
            class="animate-in fade-in slide-in-from-right-6 duration-300"
            :style="{ animationDelay: `${100 + i * 60}ms`, animationFillMode: 'backwards' }"
            @update="(q: number) => updateItem(item.id, q)"
            @remove="removeItem(item.id)"
          />
        </div>
        <div v-else class="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          Your cart is empty.
          <NuxtLink to="/menu" class="text-primary hover:underline" @click="setOpen(false)">
            Browse the menu
          </NuxtLink>
        </div>
      </div>

      <div v-if="items.length" class="mt-auto border-t border-border p-4">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-muted-foreground">Subtotal</span>
          <span class="text-lg font-bold">{{ formatNaira(subtotal) }}</span>
        </div>
        <NuxtLink
          to="/checkout"
          class="mt-3 block rounded-full bg-primary px-6 py-3 text-center text-sm font-medium uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90"
          @click="setOpen(false)"
        >
          Checkout
        </NuxtLink>
      </div>
    </SheetContent>
  </Sheet>
</template>
