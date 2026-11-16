import { describe, expect, it, vi } from "vitest";

// orderAccess imports server helpers that touch Nuxt at call time only;
// the pure rule under test needs none of them.
vi.mock("~~/server/utils/supabase", () => ({ getAuthUser: vi.fn() }));
vi.mock("~~/server/utils/db", () => ({ db: vi.fn(), must: vi.fn() }));
vi.mock("~~/server/utils/api", () => ({ apiError: vi.fn(), isUuid: () => true }));

const { orderViewer } = await import("../server/utils/orderAccess");

const guestOrder = { id: "o1", user_id: null, customer_email: "Buyer@Mail.com" };
const ownedOrder = { id: "o2", user_id: "u1", customer_email: "buyer@mail.com" };

describe("orderViewer (who may act on an order)", () => {
  it("lets admins see any order", () => {
    expect(orderViewer(ownedOrder, { id: "x", app_metadata: { role: "admin" } }, null)).toBe("admin");
    expect(orderViewer(guestOrder, { id: "x", app_metadata: { role: "admin" } }, null)).toBe("admin");
  });

  it("lets the account that placed an order see it, nobody else", () => {
    expect(orderViewer(ownedOrder, { id: "u1" }, null)).toBe("owner");
    expect(orderViewer(ownedOrder, { id: "u2", email: "buyer@mail.com", email_confirmed_at: "x" }, null)).toBeNull();
    expect(orderViewer(ownedOrder, null, "buyer@mail.com")).toBeNull();
  });

  it("lets a CONFIRMED account with the same email see a guest order", () => {
    expect(orderViewer(guestOrder, { id: "u9", email: "buyer@mail.com", email_confirmed_at: "2026-01-01" }, null)).toBe("owner");
  });

  it("never trusts an unconfirmed email", () => {
    expect(orderViewer(guestOrder, { id: "u9", email: "buyer@mail.com", email_confirmed_at: null }, null)).toBeNull();
  });

  it("accepts a guest pass only for the order's own email", () => {
    expect(orderViewer(guestOrder, null, "buyer@mail.com")).toBe("guest");
    expect(orderViewer(guestOrder, null, "someone@else.com")).toBeNull();
    expect(orderViewer(guestOrder, null, null)).toBeNull();
  });
});
