<script setup lang="ts">
import M3Icon from "@/components/M3Icon.vue";

/* Single responsibility: order CTA band with store info.
   All copy, info rows and actions arrive via props. */

export interface VisitInfo {
  icon: string;
  label: string;
  value: string;
}

export interface VisitCta {
  label: string;
  to: string;
}

interface Props {
  eyebrow: string;
  title: string;
  description: string;
  info: VisitInfo[];
  primaryCta: VisitCta;
  secondaryCta: VisitCta;
}

defineProps<Props>();
</script>

<template>
  <section class="mx-auto max-w-7xl px-6 pb-20">
    <div class="overflow-hidden rounded-3xl bg-primary-container text-on-primary-container shadow-m3-2">
      <div class="grid gap-10 p-8 sm:p-12 lg:grid-cols-2 lg:items-center">
        <div>
          <p class="text-xs font-medium uppercase tracking-[0.4em]">{{ eyebrow }}</p>
          <h2 class="m3-headline-lg mt-3 sm:m3-display-sm md:m3-display-md">{{ title }}</h2>
          <p class="m3-body-md mt-4 opacity-80">{{ description }}</p>
          <div class="mt-8 flex flex-col gap-3 sm:flex-row">
            <NuxtLink
              :to="primaryCta.to"
              class="rounded-full bg-primary px-8 py-4 text-center text-xs font-medium uppercase tracking-widest text-primary-foreground shadow-m3-2 transition-colors hover:bg-primary/90"
            >
              {{ primaryCta.label }}
            </NuxtLink>
            <NuxtLink
              :to="secondaryCta.to"
              class="rounded-full border border-current px-8 py-4 text-center text-xs font-medium uppercase tracking-widest transition-colors hover:bg-primary hover:text-primary-foreground hover:border-primary"
            >
              {{ secondaryCta.label }}
            </NuxtLink>
          </div>
        </div>
        <ul class="space-y-4">
          <li
            v-for="row in info"
            :key="row.label"
            class="flex items-center gap-4 rounded-2xl bg-primary px-5 py-4 text-primary-foreground shadow-m3-1"
          >
            <M3Icon :name="row.icon" :size="28" />
            <div>
              <p class="m3-label-md uppercase tracking-widest opacity-80">{{ row.label }}</p>
              <p class="m3-title-sm">{{ row.value }}</p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
