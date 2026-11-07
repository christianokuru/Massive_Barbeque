-- Track provider refunds that are still in flight, so a retry checks the
-- existing refund instead of asking the provider for a second one.
-- Apply in the Supabase SQL Editor after 0001–0011.
--
--   refund_status: null (no refund) | 'requesting' (call in progress)
--                  | 'pending' (provider accepted, not finished) | 'done'
--   refund_id:     the provider's refund id (used to check progress)

alter table public.payments
  add column if not exists refund_id text,
  add column if not exists refund_status text,
  add column if not exists refund_requested_at timestamptz;

do $$
begin
  alter table public.payments drop constraint if exists payments_refund_status_check;
  alter table public.payments add constraint payments_refund_status_check
    check (refund_status is null or refund_status in ('requesting', 'pending', 'done'));
end $$;
