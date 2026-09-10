<script setup lang="ts">
import { ArrowUp, ArrowUpRight, Clock, Mail, MapPin } from "lucide-vue-next";
import Logo from "@/components/custom/general/Logo.vue";

/* Single responsibility: site footer. Brand + socials, explore links,
   visit info (hours/location/contact), and an order CTA — the patterns
   top restaurant sites repeat: find us, feed us, follow us. */

const currentYear = new Date().getFullYear();

const explore = [
  { name: "Menu", to: "/menu" },
  { name: "Track order", to: "/dashboard/orders" },
  { name: "Account", to: "/dashboard" },
  { name: "Log in", to: "/login" },
];

const socials = [
  { name: "Instagram", href: "https://www.instagram.com/massivebarbeque" },
  { name: "X", href: "https://twitter.com/massivebarbeque" },
  { name: "Facebook", href: "https://www.facebook.com/massivebarbeque" },
];

function toTop() {
  const lenis = (useNuxtApp().$lenis as { scrollTo(t: number, o?: object) } | undefined);
  if (lenis?.scrollTo) lenis.scrollTo(0, { duration: 1.2 });
  else window.scrollTo({ top: 0, behavior: "smooth" });
}
</script>

<template>
  <footer class="overflow-hidden bg-inverse-surface text-inverse-on-surface">
    <div class="mx-auto max-w-7xl px-4 pt-14 sm:px-6 sm:pt-16">
      <div class="grid gap-10 pb-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
        <!-- Brand -->
        <div>
          <Logo class="mb-5" />
          <p class="max-w-xs text-sm leading-relaxed text-inverse-on-surface/70">
            Premium BBQ in Lagos — catfish, chicken, turkey, croaker and sides.
            Grilled to order, delivered hot.
          </p>
          <div class="mt-5 flex flex-wrap gap-2">
            <a
              v-for="s in socials"
              :key="s.name"
              :href="s.href"
              target="_blank"
              rel="noopener"
              :aria-label="`Massive Barbeque on ${s.name}`"
              class="inline-flex items-center gap-1 rounded-full border border-inverse-on-surface/20 px-3 py-1.5 text-xs font-medium text-inverse-on-surface/80 transition-colors hover:border-inverse-on-surface/50 hover:text-inverse-on-surface"
            >
              {{ s.name }}
              <ArrowUpRight class="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        <!-- Explore -->
        <nav aria-label="Footer">
          <h3 class="mb-5 text-xs font-medium uppercase tracking-[0.3em] text-inverse-on-surface/60">Explore</h3>
          <ul class="space-y-3">
            <li v-for="link in explore" :key="link.name">
              <NuxtLink :to="link.to" class="text-sm text-inverse-on-surface/75 transition-colors hover:text-inverse-on-surface">
                {{ link.name }}
              </NuxtLink>
            </li>
          </ul>
        </nav>

        <!-- Visit -->
        <div>
          <h3 class="mb-5 text-xs font-medium uppercase tracking-[0.3em] text-inverse-on-surface/60">Visit us</h3>
          <ul class="space-y-3 text-sm text-inverse-on-surface/75">
            <li class="flex items-start gap-2.5">
              <MapPin class="mt-0.5 h-4 w-4 shrink-0 text-inverse-on-surface/50" />
              Lagos, Nigeria
            </li>
            <li class="flex items-start gap-2.5">
              <Clock class="mt-0.5 h-4 w-4 shrink-0 text-inverse-on-surface/50" />
              Open daily · delivery across Lagos
            </li>
            <li>
              <a href="mailto:info@massivebarbeque.com" class="flex items-start gap-2.5 transition-colors hover:text-inverse-on-surface">
                <Mail class="mt-0.5 h-4 w-4 shrink-0 text-inverse-on-surface/50" />
                info@massivebarbeque.com
              </a>
            </li>
          </ul>
        </div>

        <!-- Order CTA -->
        <div class="rounded-2xl bg-inverse-on-surface/5 p-5 sm:p-6">
          <h3 class="m3-title-md text-inverse-on-surface">Craving it now?</h3>
          <p class="m3-body-sm mt-1 text-inverse-on-surface/65">
            Order in minutes — hot delivery or quick pickup.
          </p>
          <NuxtLink
            to="/menu"
            class="mt-4 block rounded-full bg-primary px-6 py-3 text-center text-xs font-medium uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Order now
          </NuxtLink>
          <p class="mt-3 text-center text-[11px] uppercase tracking-[0.2em] text-inverse-on-surface/45">
            Paystack · Flutterwave secured
          </p>
        </div>
      </div>

      <!-- Bottom bar -->
      <div class="flex items-center justify-between gap-4 border-t border-inverse-on-surface/15 py-6">
        <p class="text-xs text-inverse-on-surface/60">© {{ currentYear }} Massive Barbeque. All rights reserved.</p>
        <button
          type="button"
          aria-label="Back to top"
          class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-inverse-on-surface/20 text-inverse-on-surface/80 transition-colors hover:border-inverse-on-surface/50 hover:text-inverse-on-surface"
          @click="toTop"
        >
          <ArrowUp class="h-5 w-5" />
        </button>
      </div>

      <!-- Watermark -->
      <p
        aria-hidden="true"
        class="pointer-events-none -mb-4 select-none text-center text-[18vw] font-bold uppercase leading-[0.8] tracking-tight text-inverse-on-surface/[0.04] sm:-mb-6 lg:text-[12rem]"
      >
        Massive
      </p>
    </div>
  </footer>
</template>
