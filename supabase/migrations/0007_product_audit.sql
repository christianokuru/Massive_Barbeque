-- Audit product catalog writes (fail-closed partners to the endpoint
-- ordering: audit-first). Apply in the Supabase SQL Editor after 0001–0006.

do $$
begin
  alter table public.admin_audit_log drop constraint if exists admin_audit_log_action_check;
  alter table public.admin_audit_log add constraint admin_audit_log_action_check
    check (action in ('promote', 'demote', 'invite', 'invite_consumed', 'invite_revoked', 'status_change', 'product_create', 'product_update', 'product_delete'));
end $$;
