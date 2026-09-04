// Seed the Supabase catalog with the opening BBQ menu.
// Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node supabase/seed.mjs
// Idempotent: upserts on category slug / product slug / variant sku.
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
  { name: "Barbeque Fish", slug: "barbeque-fish", description: "Fire-grilled whole fish, marinated in bold Nigerian spices." },
  { name: "Grilled Chicken", slug: "grilled-chicken", description: "Juicy flame-grilled chicken, half and full portions." },
  { name: "Turkey", slug: "turkey", description: "Tender grilled turkey, smoked over open flames." },
  { name: "Croaker", slug: "croaker", description: "Crispy-skinned croaker fish grilled to perfection." },
  { name: "Sides & Extras", slug: "sides", description: "Fries, slaw, plantain and more to complete the feast." },
];

const PRODUCTS = [
  {
    name: "Barbeque Catfish",
    slug: "barbeque-catfish",
    description: "Our signature whole catfish, grilled over open fire and basted in peppered marinade.",
    category: "barbeque-fish",
    featured: true,
    variants: [
      { name: "Regular", sku: "MB-CAT-REG", price: "8500.00", inventoryQty: 50 },
      { name: "Large", sku: "MB-CAT-LRG", price: "12000.00", inventoryQty: 30 },
    ],
  },
  {
    name: "Full Grilled Chicken",
    slug: "full-grilled-chicken",
    description: "Whole chicken marinated overnight and flame-grilled. Serves 3–4.",
    category: "grilled-chicken",
    featured: true,
    variants: [
      { name: "Half", sku: "MB-CHK-HLF", price: "5000.00", inventoryQty: 40 },
      { name: "Full", sku: "MB-CHK-FUL", price: "9500.00", inventoryQty: 40 },
    ],
  },
  {
    name: "Barbeque Turkey",
    slug: "barbeque-turkey",
    description: "Smoky grilled turkey portions with our house dry rub.",
    category: "turkey",
    featured: false,
    variants: [
      { name: "Regular", sku: "MB-TRK-REG", price: "7500.00", inventoryQty: 35 },
      { name: "Large", sku: "MB-TRK-LRG", price: "10500.00", inventoryQty: 20 },
    ],
  },
  {
    name: "Grilled Croaker",
    slug: "grilled-croaker",
    description: "Whole croaker fish, crispy skin, tender flesh, finished with grilled onions and pepper.",
    category: "croaker",
    featured: true,
    variants: [
      { name: "Regular", sku: "MB-CRK-REG", price: "10000.00", inventoryQty: 25 },
      { name: "Large", sku: "MB-CRK-LRG", price: "14000.00", inventoryQty: 15 },
    ],
  },
  {
    name: "Turkey Wings Platter",
    slug: "turkey-wings-platter",
    description: "A heap of char-grilled turkey wings — made for sharing (or not).",
    category: "turkey",
    featured: false,
    variants: [{ name: "Platter", sku: "MB-TWP-PLT", price: "6000.00", inventoryQty: 30 }],
  },
  {
    name: "French Fries",
    slug: "french-fries",
    description: "Golden crispy fries, salted and served hot.",
    category: "sides",
    featured: false,
    variants: [{ name: "Regular", sku: "MB-FRF-REG", price: "2500.00", inventoryQty: 100 }],
  },
  {
    name: "Coleslaw",
    slug: "coleslaw",
    description: "Fresh crunchy slaw — the cool contrast to smoky grill.",
    category: "sides",
    featured: false,
    variants: [{ name: "Regular", sku: "MB-CLS-REG", price: "1500.00", inventoryQty: 100 }],
  },
  {
    name: "Grilled Plantain",
    slug: "grilled-plantain",
    description: "Sweet ripe plantain kissed by the grill.",
    category: "sides",
    featured: false,
    variants: [{ name: "Portion", sku: "MB-GPL-POR", price: "2000.00", inventoryQty: 80 }],
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

for (const p of PRODUCTS) {
  const { data: product, error } = await supabase
    .from("products")
    .upsert(
      {
        name: p.name,
        slug: p.slug,
        description: p.description,
        category_id: catId[p.category],
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

console.log(`Seeded: ${counts.categories} categories, ${counts.products} products, ${counts.variants} variants.`);
