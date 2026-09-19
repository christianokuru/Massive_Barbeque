-- Product gallery extras (multi-image support).
-- Apply in the Supabase SQL Editor after 0001–0004.
--
-- Design: products.image_url stays the REQUIRED cover photo (cards, cart,
-- og:image keep working untouched). This table holds OPTIONAL extra photos
-- shown on the product details page. The storefront gallery renders
-- cover + extras ordered by sort_order.

create table if not exists public.product_images (
  id bigint generated always as identity primary key,
  product_id bigint not null references public.products (id) on delete cascade,
  image_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists product_images_product_idx
  on public.product_images (product_id, sort_order);

alter table public.product_images enable row level security;

-- Anon reads extras only for active products (same spirit as the 0004
-- catalog policy). No insert/update/delete policies: writes go through
-- the service role in the admin API only.
drop policy if exists "catalog read" on public.product_images;
create policy "catalog read" on public.product_images for select using (
  exists (
    select 1 from public.products p
    where p.id = product_images.product_id and p.is_active = true
  )
);
