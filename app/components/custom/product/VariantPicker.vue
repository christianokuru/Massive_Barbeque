<script setup lang="ts">
import M3Icon from "@/components/M3Icon.vue";
import { formatNaira } from "~~/shared/utils/pricing";
import { cn } from "@/lib/utils";

/* Single responsibility: variant (size) selection as an M3
   segmented-button radiogroup. One variant → info line, no chooser. */

export interface VariantOption {
  id: string | number;
  name: string;
  price: string | number;
}

interface Props {
  variants: VariantOption[];
  modelValue?: string | number | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  "update:modelValue": [value: string | number];
}>();

const single = computed(() => props.variants.length === 1);
</script>

<template>
  <div>
    <p class="m3-label-lg text-foreground">
      {{ single ? "Size" : "Choose size" }}
    </p>
    <p v-if="single" class="m3-body-md mt-2 text-muted-foreground">
      {{ variants[0].name }} · {{ formatNaira(variants[0].price) }}
    </p>
    <div v-else role="radiogroup" aria-label="Choose size" class="mt-2 flex flex-wrap gap-2">
      <button
        v-for="v in variants"
        :key="v.id"
        type="button"
        role="radio"
        :aria-checked="modelValue === v.id"
        :class="cn(
          'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          modelValue === v.id
            ? 'border-primary bg-secondary-container text-on-secondary-container'
            : 'border-border bg-card text-foreground hover:border-primary',
        )"
        @click="emit('update:modelValue', v.id)"
      >
        <M3Icon v-if="modelValue === v.id" name="check" :size="18" />
        {{ v.name }} · {{ formatNaira(v.price) }}
      </button>
    </div>
  </div>
</template>
