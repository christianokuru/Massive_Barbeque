<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import Logo from "@/components/custom/general/Logo.vue";
import NavSheet, { type NavDestination } from "@/components/custom/general/NavSheet.vue";
import CartSheet from "@/components/custom/general/CartSheet.vue";
import M3Icon from "@/components/M3Icon.vue";
import { Menu } from "lucide-vue-next";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

/* M3 small top app bar: transparent over the homepage hero,
   surfaced everywhere else. Single responsibility: top-level
   navigation chrome — destinations derive from auth state.
   Mobile nav links and the mini-cart open as sheets. */

const route = useRoute();
const scrolled = ref(false);
const navOpen = ref(false);
const cartOpen = ref(false);

/* Cart is local-first: `count` is synchronous memory state —
   no fetching, no syncing, the badge is always instant. */
const { count } = useCart();
const { isLoggedIn, displayName } = useAuth();

const isHome = computed(() => route.path === "/");
const surfaced = computed(() => !isHome.value || scrolled.value || navOpen.value || cartOpen.value);

const destinations = computed<NavDestination[]>(() => [
  { name: "Home", to: "/" },
  { name: "Menu", to: "/menu" },
  { name: "About Us", to: "/about" },
  { name: "Contact", to: "/contact" },
]);

/* Auth entry lives on the right with the cart + theme icons —
   "Account" when signed in, "Log in" otherwise. */
const authLink = computed<NavDestination>(() =>
  isLoggedIn.value ? { name: "Account", to: "/dashboard" } : { name: "Log in", to: "/login" },
);

/* Mobile sheet carries every destination including the auth entry. */
const mobileLinks = computed<NavDestination[]>(() => [...destinations.value, authLink.value]);

/* Signed-in avatar: initials from the display name (or email fallback). */
const initials = computed(() => {
  const name = displayName.value || "?";
  return (
    name
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
});

function isActive(to: string) {
  return route.path === to || route.path.startsWith(`${to}/`);
}

const cartCount = computed(() => (count.value > 99 ? "99+" : String(count.value)));
const cartLabel = computed(() =>
  count.value > 0 ? `Cart, ${count.value} items` : "Cart, empty",
);

const barTone = computed(() =>
  surfaced.value ? "text-foreground" : "text-inverse-on-surface",
);

/* Nav links stay white in both color modes, surfaced or not. */
function linkTone(active: boolean) {
  if (active) return "bg-white/15 text-white";
  return "text-white hover:bg-white/10";
}

function closeSheets() {
  navOpen.value = false;
  cartOpen.value = false;
}

watch(() => route.fullPath, closeSheets);

/* Scroll containment: Lenis drives window scroll itself, so the sheet
   overlay alone can't stop the background from moving — Lenis must be
   stopped (plus native body lock for touch). One watcher covers both
   sheets, so overlapping open/close can't unlock early. Client-only:
   watchers never run on the server. */
const { $lenis } = useNuxtApp();

function setScrollLock(locked: boolean) {
  ($lenis as { stop(): void; start(): void } | undefined)?.[locked ? "stop" : "start"]();
  document.body.style.overflow = locked ? "hidden" : "";
}

watch([navOpen, cartOpen], ([nav, cart]) => setScrollLock(nav || cart));
onUnmounted(() => setScrollLock(false));

onMounted(() => {

  const handleScroll = () => {
    scrolled.value = window.scrollY > 50;
  };
  window.addEventListener("scroll", handleScroll, { passive: true });

  onUnmounted(() => {
    window.removeEventListener("scroll", handleScroll);
  });
});
</script>

<template>
  <nav
    :class="[
      'fixed top-0 right-0 left-0 z-50 transition-[background-color,box-shadow] duration-300',
      surfaced ? 'bg-background/95 shadow-m3-1 backdrop-blur-sm' : 'bg-scrim/20 backdrop-blur-sm',
    ]"
    aria-label="Primary"
  >
    <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4 lg:px-12">
      <NuxtLink to="/" class="min-w-0 shrink transition-transform duration-200 hover:scale-105" aria-label="Massive Barbeque home">
        <Logo />
      </NuxtLink>

      <!-- Desktop destinations -->
      <div class="hidden items-center gap-1 md:flex">
        <NuxtLink
          v-for="item in destinations"
          :key="item.to"
          :to="item.to"
          :aria-current="isActive(item.to) ? 'page' : undefined"
          :class="[
            'rounded-full px-4 py-2 text-xs font-medium tracking-[0.15em] uppercase transition-colors',
            linkTone(isActive(item.to)),
          ]"
        >
          {{ item.name }}
        </NuxtLink>
      </div>

      <div class="flex shrink-0 items-center gap-0.5 sm:gap-1">
        <!-- Auth entry: desktop only, mobile uses the nav sheet.
             Signed in → initials avatar, otherwise serif "Log in". -->
        <NuxtLink
          v-if="isLoggedIn"
          to="/dashboard"
          :aria-label="`Account — ${displayName}`"
          :title="displayName"
          class="hidden h-10 w-10 items-center justify-center md:inline-flex"
        >
          <Avatar class="h-9 w-9 border border-white/40">
            <AvatarFallback class="bg-primary text-sm font-semibold text-primary-foreground">
              {{ initials }}
            </AvatarFallback>
          </Avatar>
        </NuxtLink>
        <NuxtLink
          v-else
          :to="authLink.to"
          :aria-current="isActive(authLink.to) ? 'page' : undefined"
          :class="[
            'hidden rounded-full px-4 py-2 font-serif text-sm font-medium tracking-[0.15em] uppercase transition-colors md:inline-flex',
            linkTone(isActive(authLink.to)),
          ]"
        >
          {{ authLink.name }}
        </NuxtLink>

        <!-- Cart: opens the mini-cart sheet -->
        <button
          type="button"
          :aria-label="cartLabel"
          aria-haspopup="dialog"
          :aria-expanded="cartOpen"
          :class="[
            'relative inline-flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors sm:h-11 sm:w-11',
            surfaced ? 'hover:bg-secondary-container/60' : 'hover:bg-inverse-on-surface/15',
          ]"
          @click="cartOpen = true"
        >
          <M3Icon name="shopping_cart" :size="22" />
          <Badge
            v-if="count > 0"
            class="absolute -top-0.5 -end-0.5 flex h-4 min-w-4 items-center justify-center px-1 text-[11px] leading-none"
          >
            {{ cartCount }}
          </Badge>
        </button>

        <!-- Mobile hamburger: opens the nav-links sheet -->
        <button
          type="button"
          :class="[
            'inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-11 sm:w-11 md:hidden',
            barTone,
            surfaced ? 'hover:bg-secondary-container/60' : 'hover:bg-inverse-on-surface/15',
          ]"
          :aria-expanded="navOpen"
          aria-controls="mobile-nav-sheet"
          aria-label="Open menu"
          @click="navOpen = true"
        >
          <Menu class="h-6 w-6" />
        </button>
      </div>
    </div>
  </nav>

  <!-- Mobile nav links -->
  <NavSheet
    :open="navOpen"
    :links="mobileLinks"
    @update:open="navOpen = $event"
    @close="navOpen = false"
  />

  <!-- Mini cart -->
  <CartSheet
    :open="cartOpen"
    @update:open="cartOpen = $event"
    @close="cartOpen = false"
  />
</template>
