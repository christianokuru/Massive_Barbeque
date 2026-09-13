-- Explicit admin governance: invites + audit trail.
-- Admins stay admins until an owner demotes them (sticky by default).
-- Enforcement still reads app_metadata.role (JWT/RLS untouched).
-- These tables are service-role only: RLS on, NO client policies,
-- so browsers can never read or write them directly.

create table public.admin_invites (
  email text primary key,
  invited_by_email text,
  created_at timestamptz not null default now()
);

create table public.admin_audit_log (
  id serial primary key,
  actor_email text,
  action text not null check (action in ('promote', 'demote', 'invite', 'invite_consumed')),
  target_email text not null,
  created_at timestamptz not null default now()
);

alter table public.admin_invites enable row level security;
alter table public.admin_audit_log enable row level security;

create index admin_audit_target_idx on public.admin_audit_log (target_email);
