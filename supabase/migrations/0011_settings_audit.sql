-- Audit ops settings changes (delivery fee edits).
-- Apply in the Supabase SQL Editor after 0001–0010.

do $$
begin
  alter table public.admin_audit_log drop constraint if exists admin_audit_log_action_check;
  alter table public.admin_audit_log add constraint admin_audit_log_action_check
    check (action in ('promote', 'demote', 'invite', 'invite_consumed', 'invite_revoked', 'status_change', 'product_create', 'product_update', 'product_delete', 'refund', 'settings_change'));
end $$;
