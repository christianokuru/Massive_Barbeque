-- Security hardening (audit 2026-09-18).
-- Apply in the Supabase SQL Editor after 0001–0003.

-- ============================================================
-- 1. Addresses: add WITH CHECK so inserts can't spoof user_id.
-- ============================================================
drop policy if exists "own addresses" on public.addresses;
create policy "own addresses" on public.addresses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- 2. Guest carts: split the over-permissive FOR ALL policy.
-- Anyone could previously read/write any guest cart by UUID and
-- spoof user_id on insert. (App uses localStorage carts; these
-- tables stay locked down regardless.)
-- ============================================================
drop policy if exists "cart access" on public.carts;
drop policy if exists "cart items access" on public.cart_items;

create policy "cart select" on public.carts for select
  using (user_id is null or auth.uid() = user_id);
create policy "cart insert own" on public.carts for insert
  with check (user_id is null or auth.uid() = user_id);
create policy "cart update own" on public.carts for update
  using (user_id is null or auth.uid() = user_id)
  with check (user_id is null or auth.uid() = user_id);
create policy "cart delete own" on public.carts for delete
  using (user_id is null or auth.uid() = user_id);

create policy "cart items select" on public.cart_items for select
  using (
    exists (select 1 from public.carts c where c.id = cart_id and (c.user_id is null or c.user_id = auth.uid()))
  );
create policy "cart items write" on public.cart_items for insert
  with check (
    exists (select 1 from public.carts c where c.id = cart_id and (c.user_id is null or c.user_id = auth.uid()))
  );
create policy "cart items update" on public.cart_items for update
  using (
    exists (select 1 from public.carts c where c.id = cart_id and (c.user_id is null or c.user_id = auth.uid()))
  )
  with check (
    exists (select 1 from public.carts c where c.id = cart_id and (c.user_id is null or c.user_id = auth.uid()))
  );
create policy "cart items delete" on public.cart_items for delete
  using (
    exists (select 1 from public.carts c where c.id = cart_id and (c.user_id is null or c.user_id = auth.uid()))
  );

-- ============================================================
-- 3. Catalog: anon reads active rows only. Hidden drafts, prices
-- and inventory_qty no longer leak via direct PostgREST access.
-- (Admin reads go through the service role.)
-- ============================================================
drop policy if exists "catalog read" on public.categories;
drop policy if exists "catalog read" on public.products;
drop policy if exists "catalog read" on public.product_variants;

create policy "catalog read" on public.categories for select using (is_active = true);
create policy "catalog read" on public.products for select using (is_active = true);
create policy "catalog read" on public.product_variants for select using (is_active = true);

-- ============================================================
-- 4. Audit log: actor IP column + status_change action for the
-- admin order-status endpoint (fail-closed auditing).
-- ============================================================
alter table public.admin_audit_log add column if not exists actor_ip text;

do $$
begin
  alter table public.admin_audit_log drop constraint if exists admin_audit_log_action_check;
  alter table public.admin_audit_log add constraint admin_audit_log_action_check
    check (action in ('promote', 'demote', 'invite', 'invite_consumed', 'status_change'));
end $$;

-- ============================================================
-- 5. product-images bucket: public read, no anonymous writes.
-- Uploads go through the service role (admin API); browsers must
-- never write directly. Guarded so it applies cleanly whether or
-- not the bucket/policies already exist.
-- ============================================================
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'public read product images'
  ) then
    create policy "public read product images" on storage.objects
      for select using (bucket_id = 'product-images');
  end if;
end $$;
