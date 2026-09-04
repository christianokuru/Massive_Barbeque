<script setup lang="ts">
import AppSidebar from "@/components/custom/admin/dashboard/AppSidebar.vue";
import SiteHeader from "@/components/custom/admin/dashboard/SiteHeader.vue";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

const route = useRoute();

const title = computed(() => {
  const path = route.path;
  if (path.startsWith("/admin/orders")) return "Orders";
  if (path.startsWith("/admin/products")) return "Products";
  return "Dashboard";
});
</script>

<template>
  <SidebarProvider
    :style="{
      '--sidebar-width': 'calc(var(--spacing) * 60)',
      '--header-height': 'calc(var(--spacing) * 12)',
    }"
  >
    <AppSidebar />
    <SidebarInset>
      <SiteHeader :title="title" />
      <div class="flex flex-1 flex-col">
        <div class="@container/main flex flex-1 flex-col gap-2">
          <div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <slot />
          </div>
        </div>
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
