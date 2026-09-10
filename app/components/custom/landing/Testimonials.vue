<script setup lang="ts">
import TestimonialCard, { type Testimonial } from "@/components/custom/landing/TestimonialCard.vue";
import M3Icon from "@/components/M3Icon.vue";

/* Single responsibility: social-proof band. Heading + aggregate rating
   via props; reviews loop in a seamless auto-scrolling marquee
   (duplicated track, pause on hover/focus, off for reduced motion). */

interface Props {
  eyebrow: string;
  title: string;
  rating: string;
  ratingLabel: string;
  reviews: Testimonial[];
}

defineProps<Props>();
</script>

<template>
  <section class="overflow-hidden bg-surface-container py-14 sm:py-20" aria-label="Customer reviews">
    <div class="mx-auto max-w-7xl px-4 sm:px-6">
      <div class="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="text-xs font-medium uppercase tracking-[0.4em] text-primary">{{ eyebrow }}</p>
          <h2 class="m3-headline-lg mt-3 max-w-xl sm:m3-display-sm">{{ title }}</h2>
        </div>
        <!-- Aggregate rating -->
        <div class="flex shrink-0 items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 shadow-m3-1">
          <p class="m3-display-sm font-bold text-foreground">{{ rating }}</p>
          <div>
            <div class="flex gap-0.5 text-primary" :aria-label="`Rated ${rating} out of 5`">
              <M3Icon v-for="n in 5" :key="n" name="star" :filled="true" :size="18" />
            </div>
            <p class="m3-body-sm mt-1 text-muted-foreground">{{ ratingLabel }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Marquee: duplicated list for a seamless loop -->
    <div class="marquee mt-10 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div class="marquee-track flex w-max gap-4 px-4 sm:gap-5">
        <TestimonialCard
          v-for="(review, i) in reviews"
          :key="`a-${review.name}`"
          :review="review"
          :index="i"
        />
        <TestimonialCard
          v-for="(review, i) in reviews"
          :key="`b-${review.name}`"
          :review="review"
          :index="i"
          aria-hidden="true"
          tabindex="-1"
        />
      </div>
    </div>

    <p class="m3-body-sm mt-6 text-center text-muted-foreground">
      Hover to pause · {{ reviews.length }} verified orders and counting
    </p>
  </section>
</template>

<style scoped>
.marquee-track {
  animation: testimonial-marquee 55s linear infinite;
}

.marquee:hover .marquee-track,
.marquee:focus-within .marquee-track {
  animation-play-state: paused;
}

@keyframes testimonial-marquee {
  to {
    transform: translateX(-50%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .marquee-track {
    animation: none;
  }
}
</style>
