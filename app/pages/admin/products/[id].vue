<script setup lang="ts">
import ProductForm from "@/components/custom/admin/ProductForm.vue";
definePageMeta({ layout: "admin", middleware: "admin" });
const route = useRoute();
const { user, fetchSession } = useAuth();
if (process.client) {
  await fetchSession();
  if (!user.value) await navigateTo("/login");
}
const { data: categories } = await useAsyncData("admin-cats-edit", () =>
  $fetch<{ categories: any[] }>("/api/categories").then((r) => r.categories ?? []).catch(() => [])
);
const { data: existing } = await useAsyncData(`admin-product-${route.params.id}`, () =>
  $fetch<{ product: any }>(`/api/products/${route.params.id}`).then((r) => r.product)
);
const model = ref({ name: "", slug: "", description: "", categoryId: undefined as number | undefined, imageUrl: "", isActive: true, featured: false, variants: [] as any[] });
watchEffect(() => {
  if (existing.value) {
    model.value = {
      name: existing.value.name ?? "",
      slug: existing.value.slug ?? "",
      description: existing.value.description ?? "",
      categoryId: existing.value.categoryId ?? undefined,
      imageUrl: existing.value.imageUrl ?? "",
      isActive: existing.value.isActive !== false,
      featured: !!existing.value.featured,
      variants: existing.value.variants ?? [],
    };
  }
});
const saving = ref(false);
const error = ref("");
async function submit() {
  saving.value = true;
  error.value = "";
  try {
    const { variants, ...rest } = model.value;
    await $fetch(`/api/admin/products/${route.params.id}`, { method: "PUT", body: rest });
    await navigateTo("/admin/products");
  } catch (e: any) {
    error.value = e?.data?.message || "Could not update product.";
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col gap-4 px-4 md:gap-6 lg:px-6">
    <h1 class="text-3xl font-bold">Edit product</h1>
    <ProductForm v-model="model" :categories="categories ?? []" :saving="saving" @submit="submit" />
    <p v-if="error" class="mt-3 text-sm text-red-600">{{ error }}</p>
  </div>
</template>
