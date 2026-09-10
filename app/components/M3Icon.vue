<script setup lang="ts">
import { cn } from "@/lib/utils";

/* Single responsibility: one M3 Material Symbol.
   Name + axes arrive via props; decorative by default (aria-hidden)
   unless a label is provided. */

interface Props {
  name: string;
  filled?: boolean;
  weight?: number;
  size?: number;
  label?: string;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  filled: false,
  weight: 400,
  size: 24,
});
</script>

<template>
  <span
    aria-hidden="true"
    :aria-label="props.label"
    :role="props.label ? 'img' : undefined"
    :class="cn('material-symbols-outlined inline-block leading-none select-none', props.class)"
    :style="{
      fontSize: `${props.size}px`,
      fontVariationSettings: `'FILL' ${props.filled ? 1 : 0}, 'wght' ${props.weight}, 'GRAD' 0, 'opsz' ${props.size}`,
    }"
  >{{ props.name }}</span>
</template>
