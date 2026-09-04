# Massive Barbeque — Product Requirements Document (PRD)

Online BBQ ordering platform for Lagos, Nigeria. Customers browse the menu, order for delivery or pickup, and pay online. Admins manage products, orders, and payments.

## User Roles

| Role     | Access                                              |
|----------|-----------------------------------------------------|
| Guest    | Browse, cart, guest checkout, order tracking link   |
| Customer | All guest features + order history, addresses, reorder, profile |
| Admin    | Admin dashboard: products, orders, payments, sales overview |

## Batch 1 — Storefront & Catalog ✅ Built

- Landing page: hero, featured products, categories, testimonials, pickup/delivery info
- Menu page: full catalog with category filter, search, price sorting
- Product detail page: images, variant/size selection, quantity, add to cart
- SEO: Restaurant schema, Open Graph tags, sitemap, GA4 tracking

## Batch 2 — Cart & Checkout ✅ Built

- Cart page: add/update/remove items, quantities, subtotal
- Checkout: guest or logged-in, delivery address form, delivery vs pickup, ₦2,000 flat delivery fee, order notes
- Order confirmation page: reference, receipt, track-order link (guest-compatible)

## Batch 3 — Payments ✅ Built

- Paystack: initialize, verify, webhook auto-confirms paid orders
- Flutterwave: initialize, verify, webhook auto-confirms paid orders
- Payment records tied to each order; failed payments leave order pending for retry

## Batch 4 — Accounts & Customer Dashboard ✅ Built

- Register/login/logout (email + password), persistent session, customer vs admin routing
- Dashboard overview: recent orders, quick stats
- Order history + order detail with status timeline (pending → confirmed → preparing → ready → completed/cancelled)
- Profile: name/phone, saved delivery addresses, password change, reorder past items

## Batch 5 — Admin Dashboard ✅ Built

- Overview: revenue, order counts, status breakdown
- Products: create/edit/delete, variants, pricing, stock, images, featured flags
- Orders: list with filters, detail view, status updates, cancel
- Payments: transaction records per order

## Batch 6 — Notifications & Polish ✅ Built

- Emails via Resend: order confirmation, status updates, welcome
- Toast feedback on key actions across the app

## Explicitly Out of Scope (v1)

- Reviews/ratings, discount codes, loyalty points
- SMS notifications, rider/delivery live tracking
- Multi-branch support

## Acceptance Criteria (applies to every batch)

1. `npm run build` passes with no errors.
2. Guest checkout works end-to-end without an account.
3. Paid orders auto-confirm via webhook; failed payments stay retryable.
4. Admin-only routes reject non-admin users.
5. No secret keys exposed to client code.
