<script setup lang="ts">
import type { AdminProduct } from "@/composables/useAdminProducts";
import { ImageOff, Pencil, X } from "lucide-vue-next";
import { formatNaira } from "~~/shared/utils/pricing";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const props = defineProps<{
  product: AdminProduct
}>();

const { openEdit, removeProduct } = useAdminProducts();
const confirmOpen = ref(false);

const prices = computed(() =>
  (props.product.variants ?? []).map((v) => Number(v.price || 0)).filter((n) => n > 0)
);

const priceLabel = computed(() => {
  if (prices.value.length === 0) return "No price set";
  const min = Math.min(...prices.value);
  const max = Math.max(...prices.value);
  if (min === max) return formatNaira(min);
  return `${formatNaira(min)} – ${formatNaira(max)}`;
});

async function handleDelete() {
  confirmOpen.value = false;
  await removeProduct(props.product.id, props.product.name);
}
</script>

<template>
  <Card class="overflow-hidden pt-0">
    <div class="relative aspect-[4/3] w-full overflow-hidden bg-muted">
      <img
        v-if="product.imageUrl"
        :src="product.imageUrl"
        :alt="product.name"
        loading="lazy"
        class="h-full w-full object-cover"
      />
      <div v-else class="flex h-full w-full items-center justify-center text-muted-foreground">
        <ImageOff class="size-8" />
      </div>
      <div class="absolute top-2 right-2 flex gap-1.5">
        <Button
          size="icon"
          variant="secondary"
          class="size-8 rounded-full text-primary shadow-m3-1"
          aria-label="Edit product"
          @click="openEdit(product.id)"
        >
          <Pencil class="size-4" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          class="size-8 rounded-full text-destructive shadow-m3-1"
          aria-label="Delete product"
          @click="confirmOpen = true"
        >
          <X class="size-4" />
        </Button>
      </div>
      <div v-if="product.isActive === false" class="absolute top-2 left-2">
        <Badge variant="secondary">Inactive</Badge>
      </div>
    </div>
    <CardHeader class="gap-1">
      <div class="flex items-start justify-between gap-2">
        <CardTitle class="text-base leading-snug">{{ product.name }}</CardTitle>
        <Badge v-if="product.featured" variant="outline" class="shrink-0">Featured</Badge>
      </div>
      <p class="text-lg font-semibold tabular-nums">{{ priceLabel }}</p>
    </CardHeader>
    <CardContent>
      <div v-if="(product.variants ?? []).length > 0" class="flex flex-wrap gap-1.5">
        <Badge
          v-for="variant in (product.variants ?? [])"
          :key="variant.id ?? variant.sku"
          variant="secondary"
          class="font-normal"
        >
          {{ variant.name }} · {{ formatNaira(Number(variant.price || 0)) }}
        </Badge>
      </div>
      <p v-else class="text-sm text-muted-foreground">No variants</p>
    </CardContent>
  </Card>

  <AlertDialog v-model:open="confirmOpen">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete "{{ product.name }}"?</AlertDialogTitle>
        <AlertDialogDescription>
          This permanently removes the product and all its variants. Customers will no longer see it on the menu. This cannot be undone.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction class="bg-destructive text-destructive-foreground hover:bg-destructive/90" @click="handleDelete">
          Delete
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
