<template>
  <div class="mx-auto max-w-6xl px-4 py-20 sm:py-24 md:px-6">
    <div class="mb-8 flex flex-wrap items-center gap-3">
      <NuxtLink to="/dashboard" class="text-sm font-medium">Overview</NuxtLink>
      <NuxtLink to="/dashboard/orders" class="text-sm text-muted-foreground">Orders</NuxtLink>
      <NuxtLink to="/dashboard/profile" class="text-sm text-muted-foreground">Profile</NuxtLink>
    </div>
    <slot />
  </div>
</template>
