// Central store for the admin product console: product list, the
// create/edit dialog state (shared so the sidebar "New product" shortcut
// opens the same modal), and every API call with toast feedback.
import { toast } from "vue-sonner";

export interface AdminProductVariant {
  id?: number
  name: string
  sku: string
  price: string
  comparePrice?: string | null
  inventoryQty?: number
  weight?: string | null
  isActive?: boolean
}

export interface AdminProduct {
  id: number | string
  name: string
  slug: string
  description?: string | null
  categoryId?: number | null
  imageUrl?: string | null
  isActive?: boolean
  featured?: boolean
  variants?: AdminProductVariant[]
  category?: { id: number, name: string } | null
  createdAt?: string
}

export interface AdminCategory {
  id: number
  name: string
  slug: string
}

interface DialogState {
  open: boolean
  productId: number | string | null
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

function variantKey(v: AdminProductVariant) {
  return JSON.stringify([
    v.name, v.sku, String(v.price), v.comparePrice ?? null,
    Number(v.inventoryQty ?? 0), v.weight ?? null, v.isActive !== false,
  ]);
}

function apiErrorMessage(e: any, fallback: string) {
  return e?.data?.statusMessage || e?.message || fallback;
}

export function useAdminProducts() {
  const products = useState<AdminProduct[]>("admin:products", () => []);
  const categories = useState<AdminCategory[]>("admin:categories", () => []);
  const pending = useState<boolean>("admin:products:pending", () => false);
  const dialog = useState<DialogState>("admin:product-dialog", () => ({ open: false, productId: null }));

  async function fetchProducts() {
    pending.value = true;
    try {
      const data = await $fetch<{ products: AdminProduct[] }>("/api/admin/products");
      products.value = data.products ?? [];
    } catch (e: any) {
      toast.error(apiErrorMessage(e, "Could not load products."));
    } finally {
      pending.value = false;
    }
  }

  async function fetchCategories() {
    if (categories.value.length > 0) return;
    try {
      const data = await $fetch<{ categories: AdminCategory[] }>("/api/categories");
      categories.value = data.categories ?? [];
    } catch {
      // Category select simply stays empty — products can be uncategorized.
    }
  }

  function openCreate() {
    dialog.value = { open: true, productId: null };
  }

  function openEdit(productId: number | string) {
    dialog.value = { open: true, productId };
  }

  function closeDialog() {
    dialog.value = { open: false, productId: null };
  }

  const editingProduct = computed(() =>
    dialog.value.productId == null
      ? null
      : products.value.find((p) => String(p.id) === String(dialog.value.productId)) ?? null
  );

  async function uploadImage(file: File) {
    const form = new FormData();
    form.append("file", file);
    const data = await $fetch<{ url: string }>("/api/admin/products/images", {
      method: "POST",
      body: form,
    });
    return data.url;
  }

  async function syncVariants(productId: number, next: AdminProductVariant[], prev: AdminProductVariant[]) {
    const prevById = new Map((prev ?? []).filter((v) => v.id != null).map((v) => [Number(v.id), v]));
    const nextIds = new Set((next ?? []).filter((v) => v.id != null).map((v) => Number(v.id)));

    // Removed variants.
    for (const [id] of prevById) {
      if (!nextIds.has(id)) {
        await $fetch(`/api/admin/variants/${id}`, { method: "DELETE" });
      }
    }
    // Added + changed variants.
    for (const variant of next ?? []) {
      if (variant.id == null) {
        await $fetch("/api/admin/variants", {
          method: "POST",
          body: {
            productId,
            name: variant.name,
            sku: variant.sku,
            price: variant.price,
            comparePrice: variant.comparePrice || null,
            inventoryQty: Number(variant.inventoryQty ?? 0),
            weight: variant.weight || null,
            isActive: variant.isActive !== false,
          },
        });
      } else {
        const original = prevById.get(Number(variant.id));
        if (original && variantKey(original) !== variantKey(variant)) {
          await $fetch(`/api/admin/variants/${variant.id}`, {
            method: "PUT",
            body: {
              name: variant.name,
              sku: variant.sku,
              price: variant.price,
              comparePrice: variant.comparePrice || null,
              inventoryQty: Number(variant.inventoryQty ?? 0),
              weight: variant.weight || null,
              isActive: variant.isActive !== false,
            },
          });
        }
      }
    }
  }

  async function saveProduct(form: {
    name: string
    slug: string
    description?: string
    categoryId?: number | null
    imageUrl?: string
    isActive: boolean
    featured: boolean
    variants: AdminProductVariant[]
  }) {
    const payload = {
      name: form.name.trim(),
      slug: (form.slug || slugify(form.name)).trim(),
      description: form.description?.trim() || undefined,
      categoryId: form.categoryId ?? undefined,
      imageUrl: form.imageUrl?.trim() || undefined,
      isActive: form.isActive,
      featured: form.featured,
    };

    if (dialog.value.productId == null) {
      const data = await $fetch<{ product: AdminProduct }>("/api/admin/products", {
        method: "POST",
        body: {
          ...payload,
          variants: form.variants.map((v) => ({
            name: v.name,
            sku: v.sku,
            price: v.price,
            comparePrice: v.comparePrice || undefined,
            inventoryQty: Number(v.inventoryQty ?? 0),
            weight: v.weight || undefined,
            isActive: v.isActive !== false,
          })),
        },
      });
      toast.success(`"${data.product.name}" created.`);
    } else {
      const id = dialog.value.productId;
      await $fetch(`/api/admin/products/${id}`, { method: "PUT", body: payload });
      await syncVariants(Number(id), form.variants, editingProduct.value?.variants ?? []);
      toast.success("Product updated.");
    }
    closeDialog();
    await fetchProducts();
  }

  async function removeProduct(productId: number | string, productName: string) {
    try {
      await $fetch(`/api/admin/products/${productId}`, { method: "DELETE" });
      toast.success(`"${productName}" deleted.`);
      await fetchProducts();
    } catch (e: any) {
      toast.error(apiErrorMessage(e, "Could not delete product."));
    }
  }

  return {
    products,
    categories,
    pending,
    dialog,
    editingProduct,
    fetchProducts,
    fetchCategories,
    openCreate,
    openEdit,
    closeDialog,
    saveProduct,
    removeProduct,
    uploadImage,
    slugify,
  };
}
