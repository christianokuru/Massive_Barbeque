-- Ops settings (admin-editable). Service-role only: RLS on, NO client
-- policies — reads go through /api/settings/public (single safe row),
-- writes through the admin API. Apply in the Supabase SQL Editor.

create table public.admin_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.admin_settings enable row level security;

insert into public.admin_settings (key, value)
values ('delivery_fee', '{"naira": 2000}')
on conflict (key) do nothing;
