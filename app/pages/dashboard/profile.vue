<script setup lang="ts">
definePageMeta({ layout: "dashboard", middleware: "auth" });
const { user, fetchSession, logout } = useAuth();
if (process.client) {
  await fetchSession();
  if (!user.value) await navigateTo("/login");
}
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold">Profile</h1>
    <div class="mt-6 max-w-md space-y-2 rounded border p-5 text-sm">
      <p><span class="text-gray-500">Name:</span> {{ user?.name }}</p>
      <p><span class="text-gray-500">Email:</span> {{ user?.email }}</p>
    </div>
    <button class="mt-6 rounded border px-5 py-2 text-sm" @click="logout">Log out</button>
  </div>
</template>
