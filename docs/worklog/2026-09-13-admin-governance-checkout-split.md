# 2026-09-13 — Admin governance, checkout split, auth layouts, ops docs

> Source: reconstructed from git history (`1c29e96`, author christianokuru).
> Not witnessed live — from the commit message and `git show --stat`.

## Goal

Ship owner-managed admin governance (promote/demote/invites/audit), split checkout
into multi-step + gateway-confirm pages, give auth pages their own layouts, and
write down the payments ops knowledge.

## Changes

- Admin governance: `server/utils/adminGovernance.ts` (`parseEmailList`,
  `ownerEmails`/`adminAllowEmails`, `isOwnerEmail` with `ADMIN_EMAILS` fallback,
  `requireOwner`, `auditAdminAction`, `stampAdminRole`/`stripAdminRole`,
  `findUserIdByEmail`), `server/api/admin/admins/index.{get,post,delete}.ts`,
  `app/pages/admin/admins.vue` (owner roster UI, two-click demote, self/owner
  guards). Also `NavMain.vue` owner-gated Admins link + `useAuth` `isOwner`.
- Checkout split: deleted single `app/pages/checkout.vue`, added
  `app/pages/checkout/index.vue` (3-step Contact → Fulfillment → Payment) and
  rewrote `checkout/confirm.vue` (gateway-return state machine
  `loading|verifying|paid|failed|received`, display-only verify).
- Auth UX: `AuthShell.vue` split-screen, `auth.vue` bare layout, login/register/
  forgot/reset pages reworked (duplicate-as-sign-in, `signedInInstead` /
  `emailConfirmationRequired`, non-enumerating reset notice).
- Ops docs: `docs/payment-webhooks.md` (governance, webhook deploy checklist,
  paid-but-stuck reconcile for `MB88260579`), `PROJECT_SCOPE.md` re-onboarding doc.
- Backend touch-ups: login existence check, `session.get` `isOwner`,
  contact rate-limit/escape handling, order creation fields, Flutterwave init
  fixes; `.env.example` `OWNER_EMAILS`; dashboard/menu/PDP polish
  (`SidesRail.vue` added).

## Decisions & tradeoffs (inferred)

- Sticky admins (demotion explicit, sessions survive until re-login) over
  implicit/expiry-based access.
- Webhooks as sole writer of paid status; confirm-page verify display-only —
  a deliberate split so money state has one writer.

## Verification

- Admin suites (`tests/adminGovernance.test.ts`) added here; no recorded run output.

## Where it stopped / pending (as of this commit)

- Webhook deploy checklist unchecked (needs public URL + live keys + live test order).
- Passwordless OTP login left as roadmap item in `docs/payment-webhooks.md`.

## Open questions

- None carried forward.
