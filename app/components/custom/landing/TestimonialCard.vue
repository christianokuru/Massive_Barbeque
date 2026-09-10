<script setup lang="ts">
import M3Icon from "@/components/M3Icon.vue";

/* Single responsibility: one review card for the testimonials marquee.
   Fixed width (the marquee track depends on it); all content via props. */

export interface Testimonial {
  quote: string;
  name: string;
  area: string;
  dish?: string;
  rating?: number;
}

const props = withDefaults(
  defineProps<{
    review: Testimonial;
    index?: number;
  }>(),
  { index: 0 },
);

/* Initials avatar cycling M3 container tones — no photos needed. */
const palettes = [
  "bg-primary-container text-on-primary-container",
  "bg-secondary-container text-on-secondary-container",
  "bg-tertiary-container text-on-tertiary-container",
];

const palette = computed(() => palettes[props.index % palettes.length]);

const initials = computed(() =>
  props.review.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase(),
);

const stars = computed(() => {
  const rating = Number(props.review.rating ?? 5);
  return Number.isFinite(rating) ? Math.min(5, Math.max(0, Math.round(rating))) : 5;
});
</script>

<template>
  <figure
    class="flex w-[280px] shrink-0 snap-start flex-col rounded-2xl border border-border bg-card p-5 shadow-m3-1 sm:w-[340px] sm:p-6"
  >
    <div class="flex items-center justify-between gap-2">
      <div class="flex gap-0.5 text-primary" :aria-label="`Rated ${stars} out of 5`">
        <M3Icon
          v-for="n in 5"
          :key="n"
          name="star"
          :filled="n <= stars"
          :size="18"
          :class="n <= stars ? '' : 'opacity-30'"
        />
      </div>
      <M3Icon name="format_quote" :size="28" class="text-primary/30" />
    </div>

    <blockquote class="m3-body-md mt-3 flex-1 text-foreground">
      “{{ review.quote }}”
    </blockquote>

    <p
      v-if="review.dish"
      class="mt-3 inline-flex w-fit items-center rounded-full bg-secondary-container/60 px-3 py-1 text-xs font-medium text-on-secondary-container"
    >
      Ordered the {{ review.dish }}
    </p>

    <figcaption class="mt-4 flex items-center gap-3 border-t border-border pt-4">
      <span
        :class="['inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold', palette]"
        aria-hidden="true"
      >
        {{ initials }}
      </span>
      <span class="min-w-0">
        <span class="m3-label-md block truncate text-foreground">{{ review.name }}</span>
        <span class="m3-body-sm block text-muted-foreground">{{ review.area }}, Lagos</span>
      </span>
    </figcaption>
  </figure>
</template>
