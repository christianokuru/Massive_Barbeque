<script setup lang="ts">
const props = defineProps({
  modelValue: { type: Object, required: true },
  categories: { type: Array, default: () => [] },
  saving: { type: Boolean, default: false },
});
const emit = defineEmits(["update:modelValue", "submit"]);

function set(field: string, value: any) {
  emit("update:modelValue", { ...props.modelValue, [field]: value });
}

function setVariant(index: number, field: string, value: any) {
  const variants = [...(props.modelValue.variants ?? [])];
  variants[index] = { ...variants[index], [field]: value };
  set("variants", variants);
}

function addVariant() {
  set("variants", [
    ...(props.modelValue.variants ?? []),
    { name: "", sku: "", price: "", inventoryQty: 0, isActive: true },
  ]);
}

function removeVariant(index: number) {
  set(
    "variants",
    (props.modelValue.variants ?? []).filter((_: any, i: number) => i !== index)
  );
}
</script>

<template>
  <form class="space-y-6" @submit.prevent="emit('submit')">
    <div class="grid gap-4 md:grid-cols-2">
      <label class="block">
        <span class="mb-1 block text-sm font-medium">Name *</span>
        <input :value="modelValue.name" required class="w-full rounded border border-gray-300 px-3 py-2" @input="set('name', ($event.target as HTMLInputElement).value)" />
      </label>
      <label class="block">
        <span class="mb-1 block text-sm font-medium">Slug *</span>
        <input :value="modelValue.slug" required class="w-full rounded border border-gray-300 px-3 py-2" @input="set('slug', ($event.target as HTMLInputElement).value)" />
      </label>
    </div>
    <label class="block">
      <span class="mb-1 block text-sm font-medium">Description</span>
      <textarea :value="modelValue.description" rows="3" class="w-full rounded border border-gray-300 px-3 py-2" @input="set('description', ($event.target as HTMLTextAreaElement).value)" />
    </label>
    <div class="grid gap-4 md:grid-cols-3">
      <label class="block">
        <span class="mb-1 block text-sm font-medium">Category</span>
        <select :value="modelValue.categoryId ?? ''" class="w-full rounded border border-gray-300 px-3 py-2" @change="set('categoryId', ($event.target as HTMLSelectElement).value ? Number(($event.target as HTMLSelectElement).value) : undefined)">
          <option value="">No category</option>
          <option v-for="c in (categories as any[])" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </label>
      <label class="block">
        <span class="mb-1 block text-sm font-medium">Image URL</span>
        <input :value="modelValue.imageUrl" class="w-full rounded border border-gray-300 px-3 py-2" @input="set('imageUrl', ($event.target as HTMLInputElement).value)" />
      </label>
      <div class="flex items-end gap-4">
        <label class="flex items-center gap-2 text-sm"><input type="checkbox" :checked="modelValue.isActive !== false" @change="set('isActive', ($event.target as HTMLInputElement).checked)" /> Active</label>
        <label class="flex items-center gap-2 text-sm"><input type="checkbox" :checked="!!modelValue.featured" @change="set('featured', ($event.target as HTMLInputElement).checked)" /> Featured</label>
      </div>
    </div>

    <div>
      <div class="mb-2 flex items-center justify-between">
        <h3 class="font-medium">Variants</h3>
        <button type="button" class="rounded border px-3 py-1 text-sm" @click="addVariant">+ Add variant</button>
      </div>
      <div v-for="(v, i) in (modelValue.variants ?? [])" :key="i" class="mb-3 grid gap-2 rounded border p-3 md:grid-cols-5">
        <input :value="v.name" placeholder="Name (e.g. Full)" class="rounded border px-2 py-1 text-sm" @input="setVariant(i, 'name', ($event.target as HTMLInputElement).value)" />
        <input :value="v.sku" placeholder="SKU" class="rounded border px-2 py-1 text-sm" @input="setVariant(i, 'sku', ($event.target as HTMLInputElement).value)" />
        <input :value="v.price" placeholder="Price (e.g. 8500.00)" class="rounded border px-2 py-1 text-sm" @input="setVariant(i, 'price', ($event.target as HTMLInputElement).value)" />
        <input :value="v.inventoryQty" type="number" min="0" placeholder="Stock" class="rounded border px-2 py-1 text-sm" @input="setVariant(i, 'inventoryQty', Number(($event.target as HTMLInputElement).value))" />
        <button type="button" class="text-sm text-red-600" @click="removeVariant(i)">Remove</button>
      </div>
    </div>

    <button type="submit" :disabled="saving" class="rounded bg-black px-6 py-3 text-white disabled:opacity-50">
      {{ saving ? "Saving…" : "Save product" }}
    </button>
  </form>
</template>
