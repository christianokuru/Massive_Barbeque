<script setup lang="ts">
import type { Component } from "vue";
import { ClipboardList, LayoutDashboard, Package, Plus } from "lucide-vue-next";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface NavItem {
  title: string
  url: string
  icon?: Component
}

const route = useRoute();

const items: NavItem[] = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Orders", url: "/admin/orders", icon: ClipboardList },
  { title: "Products", url: "/admin/products", icon: Package },
];

function isActive(url: string) {
  if (url === "/admin") return route.path === "/admin";
  return route.path === url || route.path.startsWith(`${url}/`);
}
</script>

<template>
  <SidebarGroup>
    <SidebarGroupContent class="flex flex-col gap-2">
      <SidebarMenu>
        <SidebarMenuItem class="flex items-center gap-2">
          <SidebarMenuButton
            as-child
            tooltip="New product"
            class="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
          >
            <NuxtLink to="/admin/products/new">
              <Plus />
              <span>New product</span>
            </NuxtLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      <SidebarMenu>
        <SidebarMenuItem v-for="item in items" :key="item.title">
          <SidebarMenuButton as-child :tooltip="item.title" :is-active="isActive(item.url)">
            <NuxtLink :to="item.url">
              <component :is="item.icon" v-if="item.icon" />
              <span>{{ item.title }}</span>
            </NuxtLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
</template>
