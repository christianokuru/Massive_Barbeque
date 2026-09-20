# Admin Dashboard × Database × User Dashboard — Audit & Fix Tracker

Deep audit of the admin console against the database contract and the user
dashboard. Read every file: `app/pages/admin/**`, `app/pages/dashboard/**`,
`app/layouts/admin.vue`, `app/layouts/dashboard.vue`,
`app/components/custom/admin/**`, `server/api/admin/**`,
`server/api/orders*`, `server/utils/{mappers,supabase,adminGovernance,adminBootstrap,orderClaim}.ts`,
`shared/utils/orderStatus.ts`, all five `supabase/migrations/*.sql`.

Ground truths: order pipeline `pending → confirmed → preparing → ready → completed`
(+ `cancelled` branch, enforced by `canTransitionOrder`); webhooks are the sole
`paid` writer; `delivery_address` is raw snake_case JSONB; `0004` migration is a
hard deploy dependency for admin status updates (audit `status_change`
constraint + `actor_ip`).

How to use this file: check boxes as fixes land. Every fix ships with a test —
see "Test plan" per item. Suggested build order is at the bottom.

- [ ] = open, [x] = fixed + tested, [~] = decision needed (product call).

---

## A. Admin home (`app/pages/admin/index.vue`)

- [ ] **A1. Wrong login redirect on all admin pages.** Signed-out client guard
  goes to `/login` (customer door); `admin` middleware uses `/admin/login`.
  Files: `admin/index.vue:19-22`, `admin/orders.vue:7`, `admin/products.vue:12`,
  `admin/orders/[id].vue:8`, `admin/admins.vue:9`.
  _Test: middleware test — guest navigating `/admin/*` lands `/admin/login`;
  non-admin lands `/`._
- [x] **A2. `activeProducts` stat caps at 50.** Counts via public
  `GET /api/products` (limit-clamped, active-only). Derive from the admin
  product list or a count endpoint instead. (`admin/index.vue:30-32`)
  _Test: seed 60 active products, stat reads 60._
  **Fixed 2026-09-20:** dashboard now reads `/api/admin/products`
  (unbounded, includes inactive) and counts `isActive !== false`.
- [x] **A3. DataTable tabs count a 50-order slice.** `recentOrders` slices 50,
  tab badges present as totals. Pass full list or relabel.
  (`admin/index.vue:65-77` + `DataTable.vue:103-109`)
  _Test: seed >50 orders across statuses, tab counts match DB._
  **Fixed 2026-09-20:** full order list passed as `orderRows`; tabs count the
  whole dataset (client pagination absorbs volume until G4 server paging).
- [ ] **A4. Unbounded full-table fetch for stats.** `GET /api/admin/orders`
  selects all rows; revenue/counts computed client-side. Add server pagination
  + aggregate endpoint before scale hurts.
  _Test: endpoint accepts `limit/offset`, returns `total`._
- [x] **A5. Dead `revenueDeltaPct` badge.** Always `null`; compute WoW/MoM or
  remove the prop. (`admin/index.vue:46`, `SectionCards.vue:40-45`)
  _Test: delta math unit test in `shared/utils/` if computed._
  **Fixed 2026-09-20:** real week-over-week paid-revenue delta via new pure
  `pctChange()` in `shared/utils/pricing.ts` (null when baseline is 0, badge
  hides); 4 tests in `tests/pricing.test.ts`.
- [ ] **A6. Revenue ignores cancels/refunds.** Paid-then-cancelled orders still
  sum into revenue. Decide netting rule.
  _Test: paid+cancelled order excluded (or included) per rule._

## B. Admin DataTable (`dashboard/DataTable.vue`)

- [x] **B1. Selection checkboxes with no bulk action.** Add bulk status update
  or remove the select column. (`DataTable.vue:129-143,313-315`)
  _Test: bulk transition respects `canTransitionOrder`; illegal rows skipped._
  **Fixed 2026-09-20:** bulk bar appears on selection — target select,
  live applicable count, Apply runs individual audited PUTs (payment untouched),
  skipped/failed reported via toasts, selection clears + table refreshes.
  Pure `planBulkStatusChange()` in `shared/utils/orderStatus.ts` + 3 tests.
- [x] **B2. No order search.** Add search by order number / customer / email
  (filtering feature already registered in `features.ts`).
  _Test: query filters rows; empty-result state renders._
  **Fixed 2026-09-20:** full-width search (number/name/email, case-insensitive)
  via pure `filterOrderRows()` in `shared/utils/orderDisplay.ts` + 3 tests;
  empty state reads "No orders match your search." when filtering.
- (Known, do-not-fix: last-page icon uses `ChevronRight`; `Button` dead
  `asChild` prop.)

## C. Admin order detail (`app/pages/admin/orders/[id].vue`) — weakest page

- [x] **C1. `paid` offered but rejected — silently.** Dropdown includes `paid`;
  server 400s it; `save()` has no catch/toast. Remove `paid` from options,
  constrain status list to legal next states, add success/error toasts.
  (template `:51-56`, `save():23-34`, server `[id].status.put.ts:30-35`)
  _Test: UI never submits `paid`; illegal transition shows server message;
  legal transition toasts + refreshes._
  **Fixed 2026-09-20:** `legalNextStatuses()` + `ADMIN_EDITABLE_PAYMENT_STATUSES`
  added to `shared/utils/orderStatus.ts` (single source; server paid-guard now
  reads the same list); admin detail dropdowns derive from them; paid orders
  show a locked payment select with explainer; save toasts success/error.
  Tests: `tests/orderStatus.test.ts` 11/11; full suite 68/68.
- [x] **C2. No fulfillment data.** Add delivery address (snake_case read),
  pickup time, notes, subtotal/delivery/total breakdown, payment references.
  Data is in the response; only the template omits it.
  _Test: delivery order renders address lines; pickup renders pickup time._
  **Fixed 2026-09-20:** detail page rebuilt into Header (identity + state +
  contact grid), Fulfillment (address via shared `deliveryAddressLines()`,
  pickup time, notes, missing-address warning for delivery orders), Payment
  (method + attempts with provider/reference/amount/paid-at), Items with
  subtotal/fee/total via shared `formatNaira()`. New
  `shared/utils/orderDisplay.ts` + `tests/orderDisplay.test.ts` (5 tests).
  `GET /api/orders/:id` now also selects `payments(*)` (additive).
  Customer detail page refactored onto the same helper (output unchanged).
- [x] **C3. `refunded`/`failed` is record-only.** No provider refund call
  exists. Label as record-only + confirm, or integrate provider refunds.
  _Test: copy asserts record-only; or refund endpoint mocked per provider._
  **Fixed 2026-09-20 (label + confirm path):** selecting `refunded` now
  requires a second confirming click with an explicit "refund the money at
  the provider first" toast; page copy already states record-only. Full
  provider-refund automation stays in PAY2.
- [ ] **C4. Audit is write-only.** No per-order history, no audit viewer.
  Surface `admin_audit_log` for the order (actor, action, time).
  _Test: status change appears in order history UI._
- [x] **C5. Unlabeled selects (a11y).** Label both dropdowns.
  **Fixed 2026-09-20:** real `<label for>` on both selects + pipeline hint
  text and record-only refund note.

## D. Products console

- [ ] **D1. No category management.** No UI to create/edit/deactivate
  categories; dialog list is public active-only (can't assign inactive).
  (`useAdminProducts.ts:89`)
  _Test: CRUD categories; inactive category assignable but hidden storefront._
- [ ] **D2. Variant editing incomplete.** Expose `comparePrice`, `weight`,
  per-variant `isActive` in the dialog (schema + API already support them).
  (`ProductDialog.vue:436-458`)
  _Test: deactivate single variant → hidden storefront, kept in admin._
- [ ] **D3. Duplicate SKU/slug → raw 500.** Return 409 with field message.
  (`admin/products/index.post.ts:56/74`, `admin/variants/index.post.ts`)
  _Test: duplicate SKU asserts 409 + message; duplicate slug likewise._
- [ ] **D4. Product delete orphans bucket files.** DB cascades; storage
  doesn't (only single-image delete cleans up).
  (`admin/products/[id].delete.ts` vs `product-images/[id].delete.ts:27-37`)
  _Test: deleting product removes its bucket files._
- [ ] **D5. Variant sync non-transactional.** Mid-loop failure leaves
  half-applied sets. (`useAdminProducts.ts:124-168`)
  _Test: simulated mid-sync failure leaves variants unchanged or fully
  reported._
- [ ] **D6. No product audit.** Log creates/updates/deletes (at least deletes).
  _Test: product delete writes audit row._
- [ ] **D7. Minor console gaps.** Admin product search; card price range mixes
  inactive variants (`AdminProductCard.vue:31-33`); client-side 5 MB pre-check
  before upload.
  _Test: search filters grid; range uses active variants only._

## E. Admin governance UI (`admin/admins.vue`, `NavMain`, `NavUser`)

- [ ] **E1. Stale demote copy.** Page + toast say session survives until
  re-login; demote revokes immediately (`index.delete.ts:48-52`). Reword both.
  (`admins.vue:104-107`, `admins.vue:89`)
  _Test: copy asserts immediate revocation (static review)._
- [ ] **E2. Invites can't be revoked.** Add revoke button + DELETE endpoint.
  _Test: revoked invite no longer auto-stamps on signup._
- [ ] **E3. Staff logout lands on customer `/login`.** Should land
  `/admin/login`. (`NavUser.vue:37-40`)
  _Test: admin logout navigates `/admin/login`._
- [ ] **E4. Admins link flashes for owners.** `isOwner` fetched on mount
  (`NavMain.vue:23-25`). Hydrate or skeleton.
  _Test: none (visual) — verify manually._

## F. User dashboard

- [ ] **F1. No payment badge in order lists.** Pending-payment vs confirmed
  indistinguishable. Add `OrderStatus` for `paymentStatus` in
  `dashboard/index.vue` rows + `dashboard/orders.vue` rows.
  _Test: pending-payment order shows pending badge in list._
- [ ] **F2. No "Complete payment" path.** Stranded unpaid orders with no CTA.
  Add resume-payment button reusing pay-init (ownership/guest-token gated).
  (`dashboard/orders/[id].vue`)
  _Test: pending-payment order exposes resume; init called with order id._
- [ ] **F3. No user cancel.** Add `PUT /api/orders/:id/cancel` (owner or guest
  token, `pending → cancelled` only via `canTransitionOrder`).
  _Test: owner cancels pending (200); cancel confirmed (400); stranger (404)._
- [ ] **F4. "Order again" is just `/menu`.** Prefill cart or relabel.
  (`dashboard/orders/[id].vue:167`)
  _Test: click prefills cart lines (or label copy review)._
- [ ] **F5. Cancelled copy overpromises.** "No charge was kept" unverified for
  paid orders — qualify by payment status.
  _Test: cancelled+paid shows refund-contact copy; cancelled+pending shows
  current copy._
- [ ] **F6. `TERMINAL` duplicates pipeline.** Import `ORDER_STATUSES`-derived
  set instead. (`dashboard/index.vue:26`)
  _Test: static — pipeline change propagates (review)._
- [ ] **F7. Saved addresses missing.** `addresses` table + RLS exist, zero UI
  and zero API usage. Build saved-addresses or drop the table in a migration.
  _Test: CRUD addresses; checkout prefills default._

## G. Cross-cutting DB / API defects (need decisions first)

- [x] **[~] G1. Inventory never decremented.** Stock is check-only;
  `inventory_qty` moves only by hand-edit. Decide: decrement on webhook-paid
  (idempotent in pending→paid transition) vs documented-manual.
  (`orders.post.ts:108-116`)
  _Test: paid webhook decrements each variant qty once; replay is no-op._
  **Resolved 2026-09-20 (owner: everything is always in stock, grilled to
  order).** No decrement, no gate: removed the checkout stock-rejection in
  `orders.post.ts`, the PDP qty clamp, the VariantPicker sold-out state
  (pills/steppers now cap at 99 only), and the schema.org OutOfStock branch
  (always InStock — keeps Rich Results truthful). `inventory_qty` stays in
  the schema as unused metadata; prices/activeness still validated live.
- [x] **G2. Audit-after-write isn't fail-closed.** Order update commits before
  `auditAdminAction`; audit failure leaves a trailless change despite the
  comment. Audit first or compensate. (`[id].status.put.ts:62-74`)
  _Test: audit write failure → 500 AND status unchanged._
  **Fixed 2026-09-20:** audit row now writes BEFORE the order update — an
  audit failure 500s with the order untouched. Verified by code path
  (endpoint needs DB; covered manually) + suite 92/92.
- [x] **G3. Webhook resurrects terminal orders.** Late `charge.success` flips
  `cancelled`/`completed` back to `confirmed`. Gate on non-terminal status
  (both providers). (`webhooks/paystack.post.ts:128-135` + flutterwave twin)
  _Test: webhook on cancelled order leaves status, logs, still acks._
  **Fixed 2026-09-20:** both webhooks select order `status` and branch on
  shared `isTerminalOrderStatus()` (tested): payment row still records paid
  (money truth), order state untouched, loud log flags refund review. Still
  acks 200 so providers don't retry-storm.
- [ ] **G4. Admin list endpoints unpaginated.** Add `limit/offset` (+ `total`)
  to admin orders + products GET.
  _Test: pagination params honored; default bounded._
- [ ] **G5. Bucket not codified.** `product-images` bucket is manual; upload
  500s without it. Codify creation or document as deploy prerequisite with
  0001→0005.
  _Test: deploy checklist updated (docs) — verify manually._

## PERF. Request consolidation (added mid-session from network-tab review)

- [x] **PERF1. Session fetched 2–4× per page.** Middleware + every page (+
  double `fetchIsOwner` on admins.vue/NavMain) each hit `/api/auth/session`.
  **Fixed 2026-09-20:** middlewares write shared `useAuth` state (SSR
  serializes via payload); all pages/components read state only. One session
  call per navigation. Bonus: logout now clears `isOwner` (was sticky).
  _Test: suite green; verify Network tab shows 1 session call per nav._
- [x] **PERF2. Home fired 3 data requests + full order dump.** **Fixed
  2026-09-20:** new `GET /api/admin/overview` (stats + revenue series + 20-row
  queue, lean columns); customer count extracted to cached
  `server/utils/customerCount.ts` shared with the count endpoint.
  _Test: pure mappers (`toOrderRow`, `revenueDeltaFor`, `buildRevenueSeries`)
  unit-tested; endpoint verified manually._
- [x] **PERF3. Row mapping duplicated per page.** **Fixed 2026-09-20:**
  single `toOrderRow()` + single `OrderRow` definition (DataTable
  re-exports); both admin pages use it.

## PAY. Payment automation (deferred — needs deploy + provider wiring)

- [ ] **PAY1. Auto-`failed`.** Process provider failure events (and/or expire
  abandoned pending payments) instead of hand-labeling.
  _Test: failed provider event flips payment to failed; order untouched._
- [ ] **PAY2. Provider refunds + auto-`refunded`.** Integrate refund APIs;
  webhook confirmation flips payment to refunded. Until then `refunded`
  stays record-only (see C3).
  _Test: refund call mocked per provider; webhook flips status._
- [ ] **PAY3. Webhook wiring (ops, no code).** Deploy → set webhook URLs in
  Paystack/Flutterwave dashboards to the Vercel URL
  (`…/api/payments/webhooks/{paystack,flutterwave}`) → provider secrets in
  Vercel env → small live test payment. Custom domain optional (branding
  only). Full checklist in `docs/payment-webhooks.md`.
  _Test: live test payment flips order to paid/confirmed unassisted._

## H. New surfaces (largest scope, last)
- [ ] **H1. Payments reconciliation view.** References, amounts, webhook
  history from `payments` table.
- [ ] **H2. Customers list.** Beyond the count stat (note: count includes
  unconfirmed signups via `listUsers`; cap 10 pages implicit).
  (`admin/customers/count.get.ts:23-31`)
- [ ] **H3. Audit log viewer.** Read surface for `admin_audit_log`.
- [ ] **H4. Settings page.** Delivery fee currently code-constant
  (`DELIVERY_FEE_FLAT`); needs admin-editable home if H4 ships.
- [ ] **H5. Order notifications.** Confirm whether status-change emails exist
  (Resend key present; receipts noted for orders) — spec before build.

---

## Suggested build order

1. C1 + C2 (admin detail correctness — ops-critical).
2. A2 + A3 + B1 + A5 (dashboard stat truth).
3. [~] G1 decision (inventory truth — blocks money/stock correctness).
4. G2 + G3 + C3 (money-safety).
5. F2 + F3 + F1 (user actions).
6. E1 + E2 + E3 + A1 (governance copy + doors).
7. D1–D7 (catalog completeness).
8. G4 + G5 + H1–H5 (scale + new surfaces).

## Session log

- 2026-09-20: audit written (43 items). Build order agreed. No fixes yet.
- 2026-09-20: C1 fixed + tested (68/68).
- 2026-09-20: **found + fixed ROUTING-1 (not in original audit).**
  `admin/orders.vue` + `admin/orders/[id].vue` coexisting makes Nuxt treat the
  detail as a *nested child* of the list page; the list has no `<NuxtPage/>`
  outlet, so the detail never rendered (URL changed, list stayed — confirmed
  via console: route `admin-orders-id` rendering `<Orders>`).
  Fix: list pages moved to `index.vue` pattern —
  `admin/orders.vue → admin/orders/index.vue`,
  `dashboard/orders.vue → dashboard/orders/index.vue` (customer side had the
  identical latent bug). Pure renames, zero content change.
  _Verify: click View on any order → detail renders (restart `nuxt dev`
  first to flush the stale route table)._
- 2026-09-20: home/archive split (user feedback: home table duplicated
  /admin/orders). Home shows the action queue only (`needsAttentionRows`,
  capped 20, tabs hidden, "All clear" empty state); `/admin/orders` hosts the
  full DataTable (tabs/search/bulk, self-link hidden); plain `OrderTable.vue`
  retired. `ATTENTION_STATUSES` + `needsAttentionRows()` tested.
