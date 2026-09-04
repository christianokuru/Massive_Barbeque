-- Massive Barbeque — initial Supabase schema.
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- Supabase Auth owns identity (auth.users). App tables reference it.
-- Admin role is stored in the user's app_metadata: { "role": "admin" }.

-- ============================================================
-- TABLES
-- ============================================================

create table public.categories (
  id serial primary key,
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id serial primary key,
  name text not null,
  slug text not null unique,
  description text,
  category_id integer references public.categories (id) on delete set null,
  image_url text,
  is_active boolean not null default true,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_variants (
  id serial primary key,
  product_id integer not null references public.products (id) on delete cascade,
  name text not null,
  sku text not null unique,
  price numeric(10, 2) not null,
  compare_price numeric(10, 2),
  inventory_qty integer not null default 0,
  weight numeric(10, 2),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.addresses (
  id serial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  phone text not null,
  address_line_1 text not null,
  address_line_2 text,
  city text not null default 'Lagos',
  state text not null default 'Lagos',
  postal_code text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Cart ids are unguessable UUIDs kept in a cookie, so guest carts
-- (user_id null) can be scoped without an account.
create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cart_items (
  id serial primary key,
  cart_id uuid not null references public.carts (id) on delete cascade,
  variant_id integer not null references public.product_variants (id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  order_number text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
  fulfillment_type text not null check (fulfillment_type in ('delivery', 'pickup')),
  subtotal numeric(10, 2) not null,
  delivery_fee numeric(10, 2) not null default 0,
  total numeric(10, 2) not null,
  customer_email text not null,
  customer_name text not null,
  customer_phone text not null,
  delivery_address jsonb,
  pickup_time timestamptz,
  notes text,
  payment_method text not null check (payment_method in ('paystack', 'flutterwave')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id serial primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  variant_id integer references public.product_variants (id) on delete set null,
  product_name text not null,
  variant_name text not null,
  sku text not null,
  quantity integer not null,
  unit_price numeric(10, 2) not null,
  total_price numeric(10, 2) not null
);

create table public.payments (
  id serial primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  provider text not null check (provider in ('paystack', 'flutterwave')),
  reference text not null unique,
  amount numeric(10, 2) not null,
  currency text not null default 'NGN',
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'refunded')),
  paid_at timestamptz,
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_idx on public.products (category_id);
create index products_slug_idx on public.products (slug);
create index variants_product_idx on public.product_variants (product_id);
create index addresses_user_idx on public.addresses (user_id);
create index carts_user_idx on public.carts (user_id);
create index cart_items_cart_idx on public.cart_items (cart_id);
create index orders_user_idx on public.orders (user_id);
create index orders_number_idx on public.orders (order_number);
create index order_items_order_idx on public.order_items (order_id);
create index payments_order_idx on public.payments (order_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- Convention: admins are users whose app_metadata has {"role":"admin"}.
-- Service-role calls bypass RLS (webhooks, admin writes from API).
-- ============================================================

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.addresses enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;

-- Catalog: everyone reads active items; only admins write.
create policy "catalog read" on public.categories for select using (true);
create policy "catalog read" on public.products for select using (true);
create policy "catalog read" on public.product_variants for select using (true);

create policy "admin write categories" on public.categories for all using (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);
create policy "admin write products" on public.products for all using (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);
create policy "admin write variants" on public.product_variants for all using (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- Addresses: owners only.
create policy "own addresses" on public.addresses for all using (
  auth.uid() = user_id
);

-- Guest carts are keyed by unguessable cookie UUID; logged-in users
-- are additionally scoped to their own user_id.
create policy "cart access" on public.carts for all using (
  user_id is null or auth.uid() = user_id
);
create policy "cart items access" on public.cart_items for all using (
  exists (select 1 from public.carts c where c.id = cart_id and (c.user_id is null or c.user_id = auth.uid()))
);

-- Orders: owners read their own; guests are served by id through the
-- server API (service role, single-row lookup by unguessable UUID).
create policy "own orders" on public.orders for select using (
  auth.uid() = user_id
);
create policy "admin orders" on public.orders for all using (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);
create policy "order items of own orders" on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);
create policy "admin order items" on public.order_items for all using (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- Payments: owners see payments on their orders; writes via webhooks (service role).
create policy "own payments" on public.payments for select using (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);
create policy "admin payments" on public.payments for all using (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);
