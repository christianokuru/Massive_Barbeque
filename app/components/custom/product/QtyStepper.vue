<script setup lang="ts">
import M3Icon from "@/components/M3Icon.vue";

/* Single responsibility: quantity stepper.
   Value arrives via v-model; clamps to min. */

interface Props {
  modelValue: number;
  min?: number;
  label?: string;
}

const props = withDefaults(defineProps<Props>(), { min: 1, label: "Quantity" });
const emit = defineEmits<{
  "update:modelValue": [value: number];
}>();

function clamp(n: number) {
  return Math.max(props.min, Math.floor(Number(n) || props.min));
}

function step(delta: number) {
  emit("update:modelValue", clamp(props.modelValue + delta));
}
</script>

<template>
  <div>
    <p class="m3-label-lg text-foreground">{{ label }}</p>
    <div class="mt-2 inline-flex items-center gap-1 rounded-full border border-border bg-card p-1">
      <button
        type="button"
        aria-label="Decrease quantity"
        :disabled="modelValue <= min"
        class="inline-flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary-container hover:text-on-secondary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
        @click="step(-1)"
      >
        <M3Icon name="remove" :size="20" />
      </button>
      <input
        :value="modelValue"
        type="number"
        :min="min"
        inputmode="numeric"
        :aria-label="label"
        class="w-12 bg-transparent text-center text-sm font-medium focus-visible:outline-none"
        @change="emit('update:modelValue', clamp(($event.target as HTMLInputElement).valueAsNumber))"
      />
      <button
        type="button"
        aria-label="Increase quantity"
        class="inline-flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary-container hover:text-on-secondary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        @click="step(1)"
      >
        <M3Icon name="add" :size="20" />
      </button>
    </div>
  </div>
</template>
