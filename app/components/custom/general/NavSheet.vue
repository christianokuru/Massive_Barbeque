<script setup lang="ts">
import Logo from "@/components/custom/general/Logo.vue";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

export interface NavDestination {
  name: string;
  to: string;
}

/* Single responsibility: mobile navigation drawer.
   Destinations arrive via props; open state is controlled
   by the parent (Navbar). Sheet handles overlay + Esc. */

const props = defineProps<{
  open: boolean;
  links: NavDestination[];
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  close: [];
}>();

const route = useRoute();

function setOpen(value: boolean) {
  emit("update:open", value);
  if (!value) emit("close");
}

function isActive(to: string) {
  return route.path === to || route.path.startsWith(`${to}/`);
}

// Sheets stay mounted, so close on navigation explicitly.
watch(() => route.fullPath, () => {
  if (props.open) setOpen(false);
});
</script>

<template>
  <Sheet :open="open" @update:open="setOpen">
    <SheetContent side="right" class="w-[min(88vw,340px)] p-0 sm:max-w-sm">
      <SheetHeader class="border-b border-border p-4 text-left">
        <Logo />
        <SheetTitle class="sr-only">Menu</SheetTitle>
        <SheetDescription class="sr-only">Site navigation links</SheetDescription>
      </SheetHeader>

      <nav aria-label="Mobile" class="flex flex-col gap-1 overflow-y-auto p-4">
        <NuxtLink
          v-for="(item, i) in links"
          :key="item.to"
          :to="item.to"
          :aria-current="isActive(item.to) ? 'page' : undefined"
          :class="[
            'animate-in fade-in slide-in-from-right-6 rounded-2xl px-4 py-3 text-base font-medium duration-300 transition-colors',
            isActive(item.to)
              ? 'bg-secondary-container text-on-secondary-container'
              : 'text-foreground hover:bg-secondary-container/60',
          ]"
          :style="{ animationDelay: `${120 + i * 70}ms`, animationFillMode: 'backwards' }"
          @click="setOpen(false)"
        >
          {{ item.name }}
        </NuxtLink>
      </nav>

      <div class="mt-auto border-t border-border p-4">
        <NuxtLink
          to="/menu"
          class="block rounded-full bg-primary px-8 py-4 text-center text-sm font-medium uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90"
          @click="setOpen(false)"
        >
          Order now
        </NuxtLink>
      </div>
    </SheetContent>
  </Sheet>
</template>
