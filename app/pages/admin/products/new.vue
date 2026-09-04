<script setup lang="ts">
import ProductForm from "@/components/custom/admin/ProductForm.vue";
definePageMeta({ layout: "admin", middleware: "admin" });
const { user, fetchSession } = useAuth();
if (process.client) {
  await fetchSession();
  if (!user.value) await navigateTo("/login");
}
const { data: categories } = await useAsyncData("admin-cats", () =>
  $fetch<{ categories: any[] }>("/api/categories").then((r) => r.categories ?? []).catch(() => [])
);
const model = ref({ name: "", slug: "", description: "", categoryId: undefined, imageUrl: "", isActive: true, featured: false, variants: [] });
const saving = ref(false);
const error = ref("");

watch(() => model.value.name, (n) => {
  if (!model.value.slug) model.value.slug = n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
});

async function submit() {
  saving.value = true;
  error.value = "";
  try {
    await $fetch("/api/admin/products", { method: "POST", body: model.value });
    await navigateTo("/admin/products");
  } catch (e: any) {
    error.value = e?.data?.message || "Could not create product.";
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col gap-4 px-4 md:gap-6 lg:px-6">
    <h1 class="text-3xl font-bold">New product</h1>
    <ProductForm v-model="model" :categories="categories ?? []" :saving="saving" @submit="submit" />
    <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>
  </div>
</template>
