# 2026-11-16 — Backend rebuild (dashboards) + dashboard fixes

## Why
Owner asked for a cleaner backend and fully working customer + admin
dashboards, verified in a real browser.

## Found (baseline browser audit, local Supabase in Docker)
- Route files named `[id].cancel.post.ts` / `[id].status.put.ts` /
  `[id].default.post.ts` created ONE path segment (`:id.cancel`) and broke
  the sibling `[id].get.ts`. Result: order detail (customer, guest, admin),
  customer cancel, admin status update and set-default-address all failed.
- Admin "Revoke invite" button called a function that didn't exist.
- `auditAdminAction` never checked Supabase's `{ error }` → audit failures
  were silent (fail-closed was not real).
- Customer order list showed unclaimed guest orders for UNCONFIRMED accounts.
- Revenue chart crashed on desktop (unovis rendered during SSR).
- Categories/Settings/Admins pages loaded into plain refs → empty on the
  client, refetched, hydration mismatches. Mobile admin sidebar mismatch.
- Phone: customer tab bar cut off; admin orders table overflowed with the
  status/payment columns off-screen.
- Unpaid checkouts counted as "In progress" / "Fired up right now".
- New products could be saved with no size/price; ₦0 prices allowed.

## Changed
- `server/utils/api.ts`, `db.ts`, `catalogAdmin.ts`, `paymentProviders.ts`;
  `orderAccess.ts` rewritten around a pure, tested `orderViewer`.
- All customer + admin dashboard routes rebuilt on `defineApi` with checked
  writes; order/address/status sub-routes moved to folders.
- Admin: one-click kitchen step buttons, payments summary + filters + order
  links, customers spend/last order, readable audit log with filters, mobile
  order cards, refund in-progress state, products need ≥1 size (auto SKU).
- Customer: header with Menu link, fitted tabs, "Payment needed" card,
  clear payment chips (Unpaid / Not charged), receipt copy.
- Footer: removed public "Super" link to the staff login.

## Verified
- Unit tests (vitest) all green.
- Browser E2E (Playwright, desktop + iPhone 13) against local Supabase and a
  fake Paystack/Flutterwave: login, orders, pay → webhook → paid (both
  providers), cancel, addresses, reorder; admin order steps, refund
  pending → refunded, product create (upload) / delete, categories,
  settings, invite/revoke, audit, staff restrictions.
- API security sweep: cross-order guest passes, strangers' orders, role
  escalation, price tampering, bad input, forged webhooks — all refused.

## Not done
- Auth, contact, public catalog, order-create and payment routes keep their
  already-reviewed handlers (not moved onto `defineApi`).
- Rate limits are still in-memory (single server).

## Part 2 — remaining routes moved (same day)
Auth (login, register, reset, logout, session), contact, public catalog,
settings, sitemap, order create, payment start/verify, both webhooks and
refunds now run on the foundation. New shared payment layer:
`paymentGateway.ts` (provider calls), `paymentService.ts` (start / check /
settle), `webhookAuth.ts`, `paymentSchemas.ts`.

Verified with a before/after API contract snapshot (61 cases) — the only
differences are the intended ones below — plus the browser E2E suites and
the security sweep (now including a signed-but-fake webhook and URL-path
tricks against the providers).

Fixed / changed on purpose:
- Contact form returned 500 for every request when RESEND_API_KEY was unset
  (even the honeypot). Now 400 for bad input, honeypot → success, no key →
  503, send failure → 502.
- Logout signed the customer out on EVERY device (Supabase default
  "global"). Now this device only.
- Flutterwave verify put the client's transaction id straight into the
  provider URL before checking it (could reach other provider endpoints
  with our secret key). Ids must be digits; all path values are encoded.
- Paystack verify now checks the reference is ours before calling Paystack.
- Login: existence lookup only after a failed password (was a full user
  scan on every login); unconfirmed email → 403 with a clear message.
- Validation errors say what's wrong ("Enter a valid email address.")
  instead of h3's generic "Validation Error".
- Unknown Flutterwave transaction → 404 (was a vague 400).
