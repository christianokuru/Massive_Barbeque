# Ops log — payments, deployment & planned work

Single file for everything operational. Check items off as they land.

## Admin governance

- Roles live in `app_metadata.role`; enforcement (middleware, `requireAdmin`,
  RLS) reads it — never the env. Admins are **sticky**: nothing demotes
  implicitly.
- `OWNER_EMAILS` (server env) designates who manages admins. Empty falls
  back to `ADMIN_EMAILS` (bootstrap mode).
- Owners promote/demote at **/admin/admins** (API: `GET/POST/DELETE
  /api/admin/admins`, owner-guarded). Promoting a non-existent email stores
  an invite (`admin_invites`) consumed on signup. Every action is audited to
  `admin_audit_log`. Owners can only change via env, never the UI; nobody
  can demote themselves.
- Demoted accounts keep their JWT session until they sign out and back in.
- DB tables: `supabase/migrations/0003_admin_governance.sql` (service-role
  only — RLS on, no client policies).

## Roadmap

- [ ] **Passwordless (OTP) login** — replace/augment email+password with
      "enter your email, we'll send a code" via Supabase `signInWithOtp`.
      Why: kills the login user-enumeration debate outright (one message —
      "if an account exists, a code is on its way"), removes password
      confusion and resets, better conversion on mobile. Keep the current
      rate limits (or stricter: OTP sends cost an email per attempt) and
      reuse the `AuthShell` layout; needs a verify-code step on the login
      page plus a server endpoint wrapping `verifyOtp`.

## Payment webhooks — deployment checklist

How order confirmation works today and what must be wired up when the
site goes live at `https://massivebarbeque.com`.

## How confirmation works

1. Checkout creates the order (`pending` / `payment_status: pending`).
2. The gateway (Paystack / Flutterwave) is initialized with a `callback_url`
   / `redirect_url` pointing back at `/checkout/confirm?order=<id>`
   (see `server/utils/siteUrl.ts` — localhost in dev, canonical domain
   otherwise).
3. The confirm page verifies the payment **for display** via
   `/api/payments/{paystack,flutterwave}/verify` (server → provider).
4. The database is updated **only by webhooks**:
   - `server/api/payments/webhooks/paystack.post.ts`
     (HMAC-SHA512 over the raw body, `x-paystack-signature`)
   - `server/api/payments/webhooks/flutterwave.post.ts`
     (`verif-hash` check)
   - On success they mark the `payments` row `paid` and the order
     `payment_status: paid, status: confirmed`.

The `/checkout/confirm` verify step never writes to the DB — webhooks are
the single writer. If a webhook never arrives, the order stays `pending`
even though money moved (this happened during local testing).

## Before going live

- [ ] Deploy so `https://massivebarbeque.com` serves the Nitro server.
- [ ] Paystack dashboard → Settings → API Keys & Webhooks → webhook URL:
      `https://massivebarbeque.com/api/payments/webhooks/paystack`
- [ ] Flutterwave dashboard → Settings → Webhooks → callback URL:
      `https://massivebarbeque.com/api/payments/webhooks/flutterwave`
      (uses `FLUTTERWAVE_SECRET_KEY` as the hash input — keep it set).
- [ ] Swap test keys for **live** keys in production env
      (`PAYSTACK_SECRET_KEY`, `FLUTTERWAVE_SECRET_KEY`).
- [ ] Place a small live order, pay it, confirm the order flips to
      `confirmed`/`paid` without manual help, and that the confirm page
      shows the paid state on return.

## If an order is paid but stuck `pending`

Same reconcile the team ran on `MB88260579`: verify the reference
server-side, then mirror the webhook write **only if provider status is
success AND the amounts match**:

```bash
# 1. Provider truth (read-only)
curl -s https://api.paystack.co/transaction/verify/<REFERENCE> \
  -H "Authorization: Bearer $PAYSTACK_SECRET_KEY"
# 2. If status == success and amount/100 == orders.total, update the
#    payments row (status paid, raw payload, paid_at) and the orders row
#    (payment_status paid, status confirmed) via the service role.
```

For Flutterwave the reference is the `tx_ref`, verified via
`POST /api/payments/flutterwave/verify` with `{ transaction_id }`, or
`GET https://api.flutterwave.com/v3/transactions/<id>/verify`.
