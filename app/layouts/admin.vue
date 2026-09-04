<template>
  <div class="mx-auto max-w-7xl px-4 py-24 md:px-6">
    <div class="mb-8 flex flex-wrap items-center gap-3">
      <NuxtLink to="/admin" class="text-sm font-medium">Overview</NuxtLink>
      <NuxtLink to="/admin/products" class="text-sm text-gray-500">Products</NuxtLink>
      <NuxtLink to="/admin/orders" class="text-sm text-gray-500">Orders</NuxtLink>
    </div>
    <slot />
  </div>
</template>
