import { z } from "zod";

// Request bodies shared by both providers' payment routes.

// Client metadata: strings only, capped (never objects, never money).
const metadata = z
  .record(z.string().max(500))
  .optional()
  .refine((v) => !v || (Object.keys(v).length <= 10 && Object.keys(v).every((k) => k.length <= 100)), {
    message: "Too much metadata",
  });

export const startPaymentSchema = z.object({
  orderId: z.string().uuid("Order not found."),
  // Signed guest pass (guest orders only — the UUID alone authorizes nothing).
  guestToken: z.string().max(4096).optional(),
  // Accepted for compatibility; receipts always go to the order's email.
  email: z.string().email().max(254).optional(),
  customerName: z.string().max(100).optional(),
  customerPhone: z.string().max(30).optional(),
  metadata,
});
