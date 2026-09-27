<script setup lang="ts">
import { Plus, Trash2 } from "lucide-vue-next";
import { toast } from "vue-sonner";
import { slugify } from "~~/shared/utils/slug";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

definePageMeta({ layout: "admin", middleware: "admin" });

// Session comes from the admin middleware (single-flight) — no fetch here.

interface AdminCategoryRow {
  id: number
  name: string
  slug: string
  description?: string | null
  isActive?: boolean
  parentId?: number | null
  parent?: { id: number, name: string } | null
}

const requestHeaders = useRequestHeaders(["cookie"]);
const categories = ref<AdminCategoryRow[]>([]);
const loading = ref(true);
const busy = ref(false);
const confirmDelete = ref<number | null>(null);

async function load() {
  loading.value = true;
  try {
    const headers = process.server ? requestHeaders : undefined;
    const data = await $fetch<{ categories: AdminCategoryRow[] }>("/api/admin/categories", { headers });
    categories.value = data.categories ?? [];
  } catch {
    toast.error("Could not load categories.");
  } finally {
    loading.value = false;
  }
}

await useAsyncData("admin-categories", load);

// Create/edit dialog.
const dialogOpen = ref(false);
const editingId = ref<number | null>(null);
const slugEdited = ref(false);
const form = ref({
  name: "",
  slug: "",
  description: "",
  parentId: null as number | null,
  isActive: true,
});

function openCreate() {
  editingId.value = null;
  slugEdited.value = false;
  form.value = { name: "", slug: "", description: "", parentId: null, isActive: true };
  dialogOpen.value = true;
}

function openEdit(c: AdminCategoryRow) {
  editingId.value = c.id;
  slugEdited.value = true;
  form.value = {
    name: c.name ?? "",
    slug: c.slug ?? "",
    description: c.description ?? "",
    parentId: c.parentId ?? null,
    isActive: c.isActive !== false,
  };
  dialogOpen.value = true;
}

watch(() => form.value.name, (name) => {
  if (!slugEdited.value) form.value.slug = slugify(name);
});

// A category can't parent itself; the server also rejects loops.
const parentOptions = computed(() =>
  categories.value.filter((c) => c.id !== editingId.value)
);

async function save() {
  const name = form.value.name.trim();
  const slug = (form.value.slug.trim() || slugify(name)).trim();
  if (!name || !slug) {
    toast.error("Name must contain letters or numbers.");
    return;
  }
  busy.value = true;
  try {
    const payload = {
      name,
      slug,
      description: form.value.description.trim() || undefined,
      isActive: form.value.isActive,
      parentId: form.value.parentId,
    };
    if (editingId.value == null) {
      await $fetch("/api/admin/categories", { method: "POST", body: payload });
      toast.success(`"${name}" created.`);
    } else {
      await $fetch(`/api/admin/categories/${editingId.value}`, { method: "PUT", body: payload });
      toast.success(`"${name}" updated.`);
    }
    dialogOpen.value = false;
    // Refresh the product dialog's category cache too.
    await useAdminProducts().fetchCategories(true);
    await load();
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || "Could not save category.");
  } finally {
    busy.value = false;
  }
}

async function removeCategory(id: number, name: string) {
  if (confirmDelete.value !== id) {
    confirmDelete.value = id;
    return;
  }
  confirmDelete.value = null;
  busy.value = true;
  try {
    await $fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    toast.success(`"${name}" deleted. Its products are now uncategorized.`);
    await useAdminProducts().fetchCategories(true);
    await load();
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || "Could not delete category.");
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col gap-4 px-4 md:gap-6 lg:px-6">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold">Categories</h1>
        <p class="mt-1 text-sm text-muted-foreground">{{ categories.length }} categor{{ categories.length === 1 ? "y" : "ies" }} · inactive ones stay hidden in the store</p>
      </div>
      <Button @click="openCreate">
        <Plus /> New category
      </Button>
    </div>

    <div v-if="loading" class="text-sm text-muted-foreground">Loading…</div>
    <ul v-else-if="categories.length" class="space-y-2">
      <li
        v-for="c in categories"
        :key="c.id"
        class="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4"
      >
        <div class="min-w-0">
          <p class="flex flex-wrap items-center gap-2 text-sm font-semibold">
            <span class="truncate">{{ c.name }}</span>
            <Badge v-if="c.isActive === false" variant="secondary">Inactive</Badge>
            <span v-if="c.parent" class="truncate text-xs font-normal text-muted-foreground">under {{ c.parent.name }}</span>
          </p>
          <p class="mt-0.5 truncate font-mono text-xs text-muted-foreground">/{{ c.slug }}</p>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" @click="openEdit(c)">Edit</Button>
          <button
            type="button"
            :disabled="busy"
            :title="confirmDelete === c.id ? 'Click again to confirm' : 'Delete category'"
            class="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-medium uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            :class="confirmDelete === c.id ? 'border-destructive bg-destructive text-white' : 'border-destructive/50 text-destructive hover:bg-destructive/10'"
            @click="removeCategory(c.id, c.name)"
          >
            <Trash2 class="size-3.5" />
            {{ confirmDelete === c.id ? "Confirm?" : "Delete" }}
          </button>
        </div>
      </li>
    </ul>
    <div v-else class="rounded-lg border border-dashed p-12 text-center">
      <p class="font-medium">No categories yet</p>
      <p class="mt-1 text-sm text-muted-foreground">Group the menu — BBQ, sides, extras.</p>
      <Button class="mt-4" @click="openCreate">
        <Plus /> New category
      </Button>
    </div>

    <Dialog v-model:open="dialogOpen">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{{ editingId == null ? "New category" : "Edit category" }}</DialogTitle>
        </DialogHeader>
        <div class="grid gap-4 py-2">
          <div class="grid gap-1.5">
            <Label for="cat-name">Name *</Label>
            <Input id="cat-name" v-model="form.name" placeholder="BBQ" />
          </div>
          <div class="grid gap-1.5">
            <Label for="cat-slug">Slug *</Label>
            <Input
              id="cat-slug"
              v-model="form.slug"
              placeholder="bbq"
              @update:model-value="slugEdited = true"
            />
            <p class="text-xs text-muted-foreground">Auto-made from the name until you type your own.</p>
          </div>
          <div class="grid gap-1.5">
            <Label for="cat-description">Description</Label>
            <Textarea id="cat-description" v-model="form.description" rows="2" placeholder="Fresh off the grill" />
          </div>
          <div class="grid gap-1.5">
            <Label>Parent (optional)</Label>
            <Select :model-value="form.parentId != null ? String(form.parentId) : ''" @update:model-value="(v) => form.parentId = v ? Number(v) : null">
              <SelectTrigger>
                <SelectValue placeholder="Top level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="p in parentOptions"
                  :key="p.id"
                  :value="String(p.id)"
                >
                  {{ p.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <label class="flex cursor-pointer items-center gap-3 rounded-lg bg-muted px-3 py-2 text-sm">
            <Checkbox :model-value="form.isActive" @update:model-value="(v) => form.isActive = !!v" />
            <span><span class="font-medium">Active</span><br /><span class="text-xs text-muted-foreground">Visible in the store</span></span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" :disabled="busy" @click="dialogOpen = false">Cancel</Button>
          <Button :disabled="busy" @click="save">{{ busy ? "Saving…" : editingId == null ? "Create" : "Save changes" }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
