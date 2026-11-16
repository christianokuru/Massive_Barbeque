import { describe, expect, it } from "vitest";
import { applyQuote } from "../app/composables/cart/ops";
import { cartChangeNotice } from "../app/utils/cartNotice";
import type { CartRow } from "../app/composables/cart/types";

const row = (o: Partial<CartRow> = {}): CartRow => ({
  id: 1, variantId: 1, quantity: 2, name: "Chicken", variantName: "Regular", sku: "C-R", price: "7000", imageUrl: null, ...o,
});

describe("applyQuote", () => {
  it("refreshes price, names and photo from the live menu", () => {
    const r = applyQuote([row({ price: "1", name: "Old" })], [
      { variantId: 1, available: true, price: 7500, productId: 4, productName: "Chicken", variantName: "Regular", sku: "C-R", imageUrl: "/a.jpg" },
    ]);
    expect(r.rows[0]).toMatchObject({ price: 7500, name: "Chicken", productId: 4, imageUrl: "/a.jpg", quantity: 2 });
    expect(r.priceChanged).toBe(true);
    expect(r.removed).toEqual([]);
  });

  it("drops sizes the shop removed and reports them", () => {
    const gone = row({ id: 2, variantId: 2, name: "Ghost" });
    const r = applyQuote([row(), gone], [
      { variantId: 1, available: true, price: 7000 },
      { variantId: 2, available: false },
    ]);
    expect(r.rows.map((x) => x.variantId)).toEqual([1]);
    expect(r.removed).toEqual([gone]);
    expect(r.priceChanged).toBe(false); // "7000" vs 7000 is the same price
  });

  it("leaves rows the quote didn't mention untouched", () => {
    const r = applyQuote([row()], []);
    expect(r.rows).toEqual([row()]);
  });
});

describe("cartChangeNotice", () => {
  it("names removed items and mentions price changes in plain words", () => {
    const msg = cartChangeNotice({ removed: [row({ name: "Ghost Fish", variantName: "Big" })], priceChanged: true, ok: true });
    expect(msg).toContain("Ghost Fish – Big is no longer on the menu and was removed.");
    expect(msg).toContain("Some prices changed");
  });
  it("is empty when nothing changed", () => {
    expect(cartChangeNotice({ removed: [], priceChanged: false, ok: true })).toBe("");
  });
});
