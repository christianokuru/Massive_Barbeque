<script setup lang="ts">
import M3Icon from "@/components/M3Icon.vue";

/* Single responsibility: "how it works" step cards.
   Steps arrive via props — this component owns layout only. */

export interface HowStep {
  icon: string;
  title: string;
  text: string;
}

interface Props {
  steps: HowStep[];
}

defineProps<Props>();
</script>

<template>
  <section class="bg-muted px-6 py-20">
    <div class="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
      <div v-for="step in steps" :key="step.title" class="rounded-xl border border-border bg-card p-8">
        <span class="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
          <M3Icon :name="step.icon" :size="28" />
        </span>
        <h3 class="m3-title-lg mt-4 sm:m3-headline-sm">{{ step.title }}</h3>
        <p class="m3-body-sm mt-2 text-muted-foreground">{{ step.text }}</p>
      </div>
    </div>
  </section>
</template>
