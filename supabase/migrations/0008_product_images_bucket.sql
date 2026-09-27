-- Codify the product-images bucket (previously a manual dashboard step —
-- uploads 500 without it). Idempotent: safe to re-run.
-- The public-read policy is guarded separately in 0004.

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;
