<script setup lang="ts">
import M3Icon from "@/components/M3Icon.vue";

/* Single responsibility: stock availability signal.
   Null/undefined stock means untracked → shown as in stock. */

interface Props {
  qty?: number | string | null;
}

const props = defineProps<Props>();

const LOW_STOCK_AT = 5;

const state = computed(() => {
  if (props.qty === null || props.qty === undefined || props.qty === "") return "in";
  const n = Number(props.qty);
  if (!Number.isFinite(n) || n <= 0) return "out";
  if (n <= LOW_STOCK_AT) return "low";
  return "in";
});

const meta = computed(() => {
  switch (state.value) {
    case "out":
      return { icon: "block", label: "Out of stock", tone: "text-destructive" };
    case "low":
      return { icon: "warning", label: `Only ${props.qty} left`, tone: "text-primary" };
    default:
      return { icon: "check_circle", label: "In stock", tone: "text-tertiary" };
  }
});
</script>

<template>
  <p :class="['m3-label-md inline-flex items-center gap-1.5', meta.tone]">
    <M3Icon :name="meta.icon" :size="18" />
    {{ meta.label }}
  </p>
</template>
