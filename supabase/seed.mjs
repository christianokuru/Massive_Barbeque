// Seed the Supabase catalog from the official Massive Barbeque flyer
// (public/images/Food/menu.jpeg — the source of truth).
// Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node supabase/seed.mjs
// Idempotent: upserts on category slug / product slug / variant sku.
// Anything NOT on the flyer is REMOVED (products by slug, variants by sku)
// so the shop never sells retired items. Order history is safe:
// order_items keep their name/price snapshot, variant links SET NULL.
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

function loadEnv() {
  try {
    for (const line of fs.readFileSync(".env", "utf8").split("\n")) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m) process.env[m[1]] ??= m[2].trim().replace(/^"|"$/g, "");
    }
  } catch {}
}
loadEnv();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const CATEGORIES = [
  { name: "Chicken", slug: "grilled-chicken", description: "Flame-grilled chicken — regulars, couple and family packs." },
  { name: "Catfish", slug: "barbeque-fish", description: "Our signature whole catfish, grilled over open fire." },
  { name: "Croaker", slug: "croaker", description: "Crispy-skinned croaker fish grilled to perfection." },
  { name: "Turkey", slug: "turkey", description: "Tender grilled turkey, smoked over open flames." },
  { name: "Sides", slug: "sides", description: "Potatoes, yam fries and plantain to complete the feast." },
];

const PRODUCTS = [
  {
    name: "Chicken",
    slug: "chicken",
    description: "Juicy flame-grilled chicken. Pick a size — regular, couple pack or family pack.",
    category: "grilled-chicken",
    imageUrl: "/images/Food/chicken.jpeg",
    featured: true,
    variants: [
      { name: "Regular", sku: "MB-CHK-REG", price: "7000.00", inventoryQty: 50 },
      { name: "Couple Pack", sku: "MB-CHK-CPL", price: "13000.00", inventoryQty: 30 },
      { name: "Family Pack", sku: "MB-CHK-FAM", price: "25000.00", inventoryQty: 20 },
    ],
  },
  {
    name: "Catfish",
    slug: "catfish",
    description: "Our signature whole catfish, basted in peppered marinade. Pick a size.",
    category: "barbeque-fish",
    imageUrl: "/images/Food/catfish.jpeg",
    featured: true,
    variants: [
      { name: "Regular", sku: "MB-CAT-REG", price: "8500.00", inventoryQty: 50 },
      { name: "Standard", sku: "MB-CAT-STD", price: "11000.00", inventoryQty: 30 },
      { name: "Biggie", sku: "MB-CAT-BIG", price: "14000.00", inventoryQty: 20 },
    ],
  },
  {
    name: "Croaker",
    slug: "croaker",
    description: "Whole croaker fish, crispy skin and tender flesh. Pick a size.",
    category: "croaker",
    imageUrl: "/images/Food/croaker.jpeg",
    featured: true,
    variants: [
      { name: "Regular", sku: "MB-CRK-REG", price: "9000.00", inventoryQty: 40 },
      { name: "Standard", sku: "MB-CRK-STD", price: "12000.00", inventoryQty: 25 },
      { name: "Biggie", sku: "MB-CRK-BIG", price: "15000.00", inventoryQty: 15 },
    ],
  },
  {
    name: "Turkey",
    slug: "turkey",
    description: "Tender grilled turkey with our house dry rub. Pick a size.",
    category: "turkey",
    imageUrl: "/images/Food/turkey.jpg",
    featured: false,
    variants: [
      { name: "Regular", sku: "MB-TRK-REG", price: "10000.00", inventoryQty: 40 },
      { name: "Couple Pack", sku: "MB-TRK-CPL", price: "18000.00", inventoryQty: 25 },
      { name: "Family Pack", sku: "MB-TRK-FAM", price: "35000.00", inventoryQty: 15 },
    ],
  },
  {
    name: "Potatoes Extra",
    slug: "potatoes-extra",
    description: "Extra serving of golden potatoes — made for sharing.",
    category: "sides",
    imageUrl: "/images/Food/fried-potatoes.jpg",
    featured: false,
    variants: [{ name: "Regular", sku: "MB-SDE-POT", price: "2000.00", inventoryQty: 100 }],
  },
  {
    name: "Yam Fries",
    slug: "yam-fries",
    description: "Crispy yam fries, salted and served hot.",
    category: "sides",
    imageUrl: "/images/Food/fried-yam.jpg",
    featured: false,
    variants: [{ name: "Regular", sku: "MB-SDE-YAM", price: "3000.00", inventoryQty: 100 }],
  },
  {
    name: "Plantain Fries",
    slug: "plantain-fries",
    description: "Golden plantain fries — sweet, crisp edges, soft centre.",
    category: "sides",
    imageUrl: "/images/Food/fried-plantain.jpg",
    featured: false,
    variants: [{ name: "Regular", sku: "MB-SDE-PLT", price: "2500.00", inventoryQty: 100 }],
  },
  {
    name: "Plantain Bole",
    slug: "plantain-bole",
    description: "Fire-roasted plantain bole — smoky and sweet.",
    category: "sides",
    imageUrl: "/images/Food/plantain-boli.jpg",
    featured: false,
    variants: [{ name: "Regular", sku: "MB-SDE-BOLE", price: "2000.00", inventoryQty: 100 }],
  },
  {
    name: "Catfish Pepper Soup",
    slug: "catfish-pepper-soup",
    description: "Catfish pepper soup (Pps) — hot, spicy comfort in a bowl.",
    category: "barbeque-fish",
    imageUrl: "/images/Food/catfish-peppersoup.jpg",
    featured: false,
    variants: [{ name: "Regular", sku: "MB-CAT-PPS", price: "9000.00", inventoryQty: 40 }],
  },
];

let counts = { categories: 0, products: 0, variants: 0 };

for (const c of CATEGORIES) {
  const { error } = await supabase
    .from("categories")
    .upsert({ name: c.name, slug: c.slug, description: c.description }, { onConflict: "slug" });
  if (error) throw new Error(`category ${c.slug}: ${error.message}`);
  counts.categories++;
}

const { data: cats } = await supabase.from("categories").select("id, slug");
const catId = Object.fromEntries((cats || []).map((c) => [c.slug, c.id]));

const keepSlugs = new Set(PRODUCTS.map((p) => p.slug));
const keepSkus = new Set(PRODUCTS.flatMap((p) => p.variants.map((v) => v.sku)));

for (const p of PRODUCTS) {
  const { data: product, error } = await supabase
    .from("products")
    .upsert(
      {
        name: p.name,
        slug: p.slug,
        description: p.description,
        category_id: catId[p.category],
        image_url: p.imageUrl,
        is_active: true,
        featured: p.featured,
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single();
  if (error) throw new Error(`product ${p.slug}: ${error.message}`);
  counts.products++;

  for (const v of p.variants) {
    const { error: vError } = await supabase.from("product_variants").upsert(
      {
        product_id: product.id,
        name: v.name,
        sku: v.sku,
        price: v.price,
        inventory_qty: v.inventoryQty,
        is_active: true,
      },
      { onConflict: "sku" }
    );
    if (vError) throw new Error(`variant ${v.sku}: ${vError.message}`);
    counts.variants++;
  }
}

// Retire anything not on the flyer. Product deletes cascade to their
// variants; the stray-variant sweep catches the rest. Past orders keep
// their item snapshots (variant_id SET NULL).
const { data: existingProducts } = await supabase.from("products").select("id, slug");
const staleProductIds = (existingProducts || [])
  .filter((p) => !keepSlugs.has(p.slug))
  .map((p) => p.id);
let retiredProducts = 0;
if (staleProductIds.length) {
  const { error } = await supabase.from("products").delete().in("id", staleProductIds);
  if (error) throw new Error(`retire products: ${error.message}`);
  retiredProducts = staleProductIds.length;
}

const { data: existingVariants } = await supabase.from("product_variants").select("id, sku");
const staleVariantIds = (existingVariants || [])
  .filter((v) => !keepSkus.has(v.sku))
  .map((v) => v.id);
let retiredVariants = 0;
if (staleVariantIds.length) {
  const { error } = await supabase.from("product_variants").delete().in("id", staleVariantIds);
  if (error) throw new Error(`retire variants: ${error.message}`);
  retiredVariants = staleVariantIds.length;
}

console.log(
  `Seeded: ${counts.categories} categories, ${counts.products} products, ${counts.variants} variants. ` +
    `Retired: ${retiredProducts} products, ${retiredVariants} variants.`
);
