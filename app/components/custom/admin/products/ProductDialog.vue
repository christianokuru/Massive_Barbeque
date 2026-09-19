<script setup lang="ts">
import type { AdminProductVariant } from "@/composables/useAdminProducts";
import { z } from "zod";
import { ImagePlus, Loader2, Plus, Trash2, X } from "lucide-vue-next";
import { toast } from "vue-sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

const PRICE_RE = /^\d+(\.\d{1,2})?$/;

// Mirrors server/utils/productImages: https URLs or site-relative paths.
function isImageLocation(v: string) {
  if (!v || v.length > 2048 || /[\s\\]/.test(v)) return false;
  if (v.startsWith("https://")) return true;
  return v.startsWith("/") && !v.startsWith("//");
}

const MAX_EXTRAS = 8;

const variantSchema = z.object({
  name: z.string().min(1, "Name required"),
  sku: z.string().min(1, "SKU required"),
  price: z.string().regex(PRICE_RE, "e.g. 8500 or 8500.00"),
  inventoryQty: z.number().int().min(0),
});

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  slug: z.string().min(1, "Slug is required"),
  imageUrl: z.string().min(1, "A cover photo is required").refine(isImageLocation, {
    message: "Must be an https URL or a site path like /images/…",
  }),
  variants: z.array(variantSchema),
});

interface ExtraImageDraft {
  id?: number
  imageUrl: string
}

interface VariantDraft extends AdminProductVariant {
  _key: number
}

let keySeq = 1;

const {
  dialog,
  editingProduct,
  categories,
  fetchCategories,
  closeDialog,
  saveProduct,
  uploadImage,
  slugify,
} = useAdminProducts();

const form = ref({
  name: "",
  slug: "",
  description: "",
  categoryId: null as number | null,
  imageUrl: "",
  extraImages: [] as ExtraImageDraft[],
  removedImageIds: [] as number[],
  isActive: true,
  featured: false,
  variants: [] as VariantDraft[],
});
const errors = ref<Record<string, string>>({});
const saving = ref(false);
const uploading = ref(false);
const uploadingExtras = ref(false);
const slugEdited = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const extrasInput = ref<HTMLInputElement | null>(null);

const isEditing = computed(() => editingProduct.value != null);
const { $lenis } = useNuxtApp();
const confirmDiscard = ref(false);
const snapshot = ref("");

function snapshotForm() {
  const { variants, ...rest } = form.value;
  return JSON.stringify({
    ...rest,
    variants: variants.map(({ _key, ...v }) => v),
  });
}

const isDirty = computed(() => snapshotForm() !== snapshot.value);

function requestClose() {
  if (saving.value || uploading.value || uploadingExtras.value) return;
  if (isDirty.value) {
    confirmDiscard.value = true;
  } else {
    closeDialog();
  }
}

function discardChanges() {
  confirmDiscard.value = false;
  closeDialog();
}

function handleOpenChange(open: boolean) {
  if (!open) requestClose();
}

watch(() => dialog.value.open, (open) => {
  if (open) {
    resetForm();
    fetchCategories();
    snapshot.value = snapshotForm();
  }
});

watch([() => dialog.value.open, confirmDiscard], () => {
  const lenis = $lenis as unknown as { stop?: () => void, start?: () => void } | undefined;
  if (!lenis) return;
  if (dialog.value.open || confirmDiscard.value) lenis.stop?.();
  else lenis.start?.();
});

function blankVariant(): VariantDraft {
  return { _key: keySeq++, name: "", sku: "", price: "", inventoryQty: 0, isActive: true };
}

function resetForm() {
  const source = editingProduct.value;
  slugEdited.value = source != null;
  form.value = {
    name: source?.name ?? "",
    slug: source?.slug ?? "",
    description: source?.description ?? "",
    categoryId: source?.categoryId ?? null,
    imageUrl: source?.imageUrl ?? "",
    extraImages: (source?.images ?? []).map((img) => ({ id: img.id, imageUrl: img.imageUrl })),
    removedImageIds: [],
    isActive: source?.isActive !== false,
    featured: !!source?.featured,
    variants: (source?.variants ?? []).map((v) => ({ ...v, _key: keySeq++ })),
  };
  errors.value = {};
}

watch(() => form.value.name, (name) => {
  if (!slugEdited.value) form.value.slug = slugify(name);
});

function addVariant() {
  form.value.variants.push(blankVariant());
}

function removeVariant(key: number) {
  form.value.variants = form.value.variants.filter((v) => v._key !== key);
}

async function handleFilePicked(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  uploading.value = true;
  try {
    form.value.imageUrl = await uploadImage(file);
    toast.success("Cover photo uploaded.");
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || e?.message || "Image upload failed.");
  } finally {
    uploading.value = false;
    if (fileInput.value) fileInput.value.value = "";
  }
}

const extrasFull = computed(() => form.value.extraImages.length >= MAX_EXTRAS);

async function handleExtrasPicked(event: Event) {
  const files = Array.from((event.target as HTMLInputElement).files ?? []);
  if (!files.length) return;
  const room = MAX_EXTRAS - form.value.extraImages.length;
  if (room <= 0) {
    toast.error(`At most ${MAX_EXTRAS} extra photos per product.`);
    if (extrasInput.value) extrasInput.value.value = "";
    return;
  }
  uploadingExtras.value = true;
  try {
    for (const file of files.slice(0, room)) {
      const url = await uploadImage(file);
      form.value.extraImages.push({ imageUrl: url });
    }
    toast.success("Extra photos added — save to keep them.");
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || e?.message || "Image upload failed.");
  } finally {
    uploadingExtras.value = false;
    if (extrasInput.value) extrasInput.value.value = "";
  }
}

function removeExtraImage(index: number) {
  const [removed] = form.value.extraImages.splice(index, 1);
  if (removed?.id != null) form.value.removedImageIds.push(removed.id);
}

async function handleSubmit() {
  errors.value = {};
  const parsed = productSchema.safeParse({
    name: form.value.name.trim(),
    slug: form.value.slug.trim(),
    imageUrl: form.value.imageUrl.trim(),
    variants: form.value.variants.map((v) => ({
      name: v.name.trim(),
      sku: v.sku.trim(),
      price: v.price.trim(),
      inventoryQty: Number(v.inventoryQty ?? 0),
    })),
  });
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".");
      if (!(path in errors.value)) errors.value[path] = issue.message;
    }
    errors.value.form = "Please fix the highlighted fields.";
    return;
  }
  saving.value = true;
  try {
    await saveProduct({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: form.value.description,
      categoryId: form.value.categoryId,
      imageUrl: parsed.data.imageUrl || undefined,
      addedImageUrls: form.value.extraImages.filter((img) => img.id == null).map((img) => img.imageUrl),
      removedImageIds: form.value.removedImageIds,
      isActive: form.value.isActive,
      featured: form.value.featured,
      variants: form.value.variants.map((v, i) => ({
        id: v.id,
        name: parsed.data.variants[i].name,
        sku: parsed.data.variants[i].sku,
        price: parsed.data.variants[i].price,
        comparePrice: v.comparePrice ?? null,
        inventoryQty: parsed.data.variants[i].inventoryQty,
        weight: v.weight ?? null,
        isActive: v.isActive !== false,
      })),
    });
  } catch (e: any) {
    toast.error(e?.data?.statusMessage || e?.message || "Could not save product.");
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Dialog :open="dialog.open" @update:open="handleOpenChange">
    <DialogContent
      data-lenis-prevent
      :show-close-button="false"
      class="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
    >
      <div class="flex items-start justify-between gap-4 border-b bg-background px-6 py-4">
        <DialogHeader class="gap-1">
          <div class="flex items-center gap-2">
            <DialogTitle>{{ isEditing ? "Edit product" : "New product" }}</DialogTitle>
            <Badge v-if="isDirty" variant="secondary">Unsaved changes</Badge>
          </div>
          <DialogDescription>
            {{ isEditing ? "Update details, images and variants." : "Add a new item to the menu with optional size variants." }}
          </DialogDescription>
        </DialogHeader>
        <Button type="button" variant="ghost" size="icon" class="shrink-0" aria-label="Close" @click="requestClose">
          <X />
        </Button>
      </div>

      <div data-lenis-prevent class="grid gap-5 overflow-y-auto px-6 py-5">
        <section class="overflow-hidden rounded-xl border">
          <p class="border-b bg-card px-4 py-2 text-sm font-semibold">Cover photo <span class="text-destructive">*</span> <span class="font-normal text-muted-foreground">— shown everywhere</span></p>
          <div class="relative flex h-44 items-center justify-center overflow-hidden bg-muted">
            <img v-if="form.imageUrl" :src="form.imageUrl" alt="Product preview" class="h-full w-full object-cover" />
            <div v-else class="flex flex-col items-center gap-1 text-muted-foreground">
              <ImagePlus class="size-8" />
              <span class="text-xs">No image yet</span>
            </div>
            <Button
              type="button"
              size="sm"
              class="absolute right-3 bottom-3"
              :disabled="uploading"
              @click="fileInput?.click()"
            >
              <Loader2 v-if="uploading" class="animate-spin" />
              <ImagePlus v-else />
              {{ uploading ? "Uploading…" : form.imageUrl ? "Change image" : "Upload image" }}
            </Button>
            <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="handleFilePicked" />
          </div>
          <div class="grid gap-1.5 border-t bg-card px-4 py-3">
            <Label for="product-image-url" class="text-xs text-muted-foreground">…or paste an image URL (https://… or /images/…)</Label>
            <Input id="product-image-url" v-model="form.imageUrl" placeholder="https://…" />
            <p v-if="errors.imageUrl" class="text-xs text-destructive">{{ errors.imageUrl }}</p>
          </div>
        </section>

        <section class="grid gap-3 rounded-xl border p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold">More photos <span class="font-normal text-muted-foreground">(optional)</span></p>
              <p class="text-xs text-muted-foreground">Extra angles shown on the product page — {{ form.extraImages.length }}/{{ MAX_EXTRAS }}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              :disabled="uploadingExtras || extrasFull"
              @click="extrasInput?.click()"
            >
              <Loader2 v-if="uploadingExtras" class="animate-spin" />
              <Plus v-else />
              {{ uploadingExtras ? "Uploading…" : "Add photos" }}
            </Button>
            <input ref="extrasInput" type="file" accept="image/jpeg,image/png,image/webp" multiple class="hidden" @change="handleExtrasPicked" />
          </div>
          <div v-if="form.extraImages.length" class="grid grid-cols-3 gap-2 sm:grid-cols-4">
            <div
              v-for="(img, i) in form.extraImages"
              :key="img.id ?? `new-${i}`"
              class="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
            >
              <img :src="img.imageUrl" :alt="`Extra photo ${i + 1}`" class="h-full w-full object-cover" />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                class="absolute right-1 top-1 size-7 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                :aria-label="`Remove extra photo ${i + 1}`"
                @click="removeExtraImage(i)"
              >
                <Trash2 class="size-4" />
              </Button>
            </div>
          </div>
          <p v-else class="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
            No extra photos yet — the cover above is enough, add more whenever you like.
          </p>
        </section>

        <section class="grid gap-4 rounded-xl border p-4">
          <p class="text-sm font-semibold">Details</p>
          <div class="grid gap-4 sm:grid-cols-2">
          <div class="grid gap-1.5">
            <Label for="product-name">Name *</Label>
            <Input id="product-name" v-model="form.name" placeholder="Catfish BBQ" />
            <p v-if="errors.name" class="text-xs text-destructive">{{ errors.name }}</p>
          </div>
          <div class="grid gap-1.5">
            <Label for="product-slug">Slug *</Label>
            <Input
              id="product-slug"
              v-model="form.slug"
              placeholder="catfish-bbq"
              @update:model-value="slugEdited = true"
            />
            <p v-if="errors.slug" class="text-xs text-destructive">{{ errors.slug }}</p>
          </div>
        </div>

        <div class="grid gap-1.5">
          <Label for="product-description">Description</Label>
          <Textarea id="product-description" v-model="form.description" rows="2" placeholder="Fresh catfish grilled with house pepper sauce" />
        </div>

        <div class="grid gap-1.5">
          <Label>Category</Label>
          <Select :model-value="form.categoryId != null ? String(form.categoryId) : ''" @update:model-value="(v) => form.categoryId = v ? Number(v) : null">
            <SelectTrigger>
              <SelectValue placeholder="No category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="category in categories"
                :key="category.id"
                :value="String(category.id)"
              >
                {{ category.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        </section>

        <section class="grid gap-3 rounded-xl border p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold">Variants & pricing</p>
              <p class="text-xs text-muted-foreground">Optional — e.g. Whole / Half with their prices</p>
            </div>
            <Button type="button" variant="outline" size="sm" @click="addVariant">
              <Plus /> Add variant
            </Button>
          </div>
          <div
            v-for="(variant, i) in form.variants"
            :key="variant._key"
            class="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_1fr_1fr_auto]"
          >
            <div class="grid gap-1">
              <Input v-model="variant.name" placeholder="Name (Full)" />
              <p v-if="errors[`variants.${i}.name`]" class="text-xs text-destructive">{{ errors[`variants.${i}.name`] }}</p>
            </div>
            <div class="grid gap-1">
              <Input v-model="variant.sku" placeholder="SKU" />
              <p v-if="errors[`variants.${i}.sku`]" class="text-xs text-destructive">{{ errors[`variants.${i}.sku`] }}</p>
            </div>
            <div class="grid gap-1">
              <Input v-model="variant.price" inputmode="decimal" placeholder="₦ price" />
              <p v-if="errors[`variants.${i}.price`]" class="text-xs text-destructive">{{ errors[`variants.${i}.price`] }}</p>
            </div>
            <div class="grid gap-1">
              <Input v-model.number="variant.inventoryQty" type="number" min="0" placeholder="Stock" />
            </div>
            <Button type="button" variant="ghost" size="icon" class="text-destructive" aria-label="Remove variant" @click="removeVariant(variant._key)">
              <Trash2 />
            </Button>
          </div>
          <p v-if="form.variants.length === 0" class="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
            No variants yet — customers will see the product without size options.
          </p>
        </section>

        <section class="grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
          <label class="flex cursor-pointer items-center gap-3 rounded-lg bg-muted px-3 py-2 text-sm">
            <Checkbox :model-value="form.isActive" @update:model-value="(v) => form.isActive = !!v" />
            <span><span class="font-medium">Active</span><br /><span class="text-xs text-muted-foreground">Visible on the menu</span></span>
          </label>
          <label class="flex cursor-pointer items-center gap-3 rounded-lg bg-muted px-3 py-2 text-sm">
            <Checkbox :model-value="form.featured" @update:model-value="(v) => form.featured = !!v" />
            <span><span class="font-medium">Featured</span><br /><span class="text-xs text-muted-foreground">Shown on the homepage</span></span>
          </label>
        </section>

        <p v-if="errors.form" class="text-sm text-destructive">{{ errors.form }}</p>
      </div>

      <DialogFooter class="border-t bg-background px-6 py-4">
        <Button type="button" variant="outline" :disabled="saving" @click="requestClose">Cancel</Button>
        <Button type="button" :disabled="saving || uploading || uploadingExtras" @click="handleSubmit">
          <Loader2 v-if="saving" class="animate-spin" />
          {{ saving ? "Saving…" : isEditing ? "Save changes" : "Create product" }}
        </Button>
      </DialogFooter>

      <AlertDialog v-model:open="confirmDiscard">
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes to this product. Closing now will lose everything you entered.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction class="bg-destructive text-destructive-foreground hover:bg-destructive/90" @click="discardChanges">
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DialogContent>
  </Dialog>
</template>
