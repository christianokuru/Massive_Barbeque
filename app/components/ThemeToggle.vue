<script setup lang="ts">
import { Moon, Sun } from "lucide-vue-next";
import { cn } from "@/lib/utils";

const props = defineProps<{ class?: string }>();

const colorMode = useColorMode();

const isDark = computed(() => colorMode.value === "dark");

function toggle() {
  colorMode.preference = isDark.value ? "light" : "dark";
}
</script>

<template>
  <button
    type="button"
    :class="
      cn(
        'inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/70 text-foreground shadow-m3-1 backdrop-blur transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        props.class,
      )
    "
    :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    @click="toggle"
  >
    <Moon v-if="!isDark" class="h-5 w-5" />
    <Sun v-else class="h-5 w-5" />
  </button>
</template>
