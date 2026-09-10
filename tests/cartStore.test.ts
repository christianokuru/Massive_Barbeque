import { beforeEach, describe, expect, it, vi } from "vitest";
import { applyAdd, applyRemove, applySetQty } from "../app/composables/cart/ops";
import { createLocalCartStorage } from "../app/composables/cart/storage";
import type { CartRow } from "../app/composables/cart/types";

function row(overrides: Partial<CartRow> = {}): CartRow {
  return {
    id: 10,
    variantId: 10,
    quantity: 2,
    name: "Catfish",
    variantName: "Large",
    sku: "FISH-L",
    price: "5000",
    imageUrl: null,
    ...overrides,
  };
}

const snapshot = {
  variantId: 20,
  productName: "Chicken",
  variantName: "Full",
  sku: "CHK-F",
  price: "7500",
  imageUrl: "http://img/chicken.png",
};

describe("applyAdd", () => {
  it("appends a new row from the snapshot", () => {
    const next = applyAdd([], { variantId: 20, quantity: 1, snapshot });
    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject({
      id: 20,
      variantId: 20,
      quantity: 1,
      name: "Chicken",
      variantName: "Full",
      price: "7500",
    });
  });

  it("merges into the existing variant instead of duplicating", () => {
    const next = applyAdd([row()], { variantId: 10, quantity: 3 });
    expect(next).toHaveLength(1);
    expect(next[0].quantity).toBe(5);
  });

  it("floors quantities at 1 and caps at 99", () => {
    expect(applyAdd([], { variantId: 20, quantity: 0, snapshot })[0].quantity).toBe(1);
    expect(applyAdd([row({ quantity: 98 })], { variantId: 10, quantity: 5 })[0].quantity).toBe(99);
  });

  it("never mutates the input array", () => {
    const before = [row()];
    applyAdd(before, { variantId: 20, quantity: 1, snapshot });
    expect(before).toHaveLength(1);
  });
});

describe("applySetQty", () => {
  it("sets the quantity for the matching row only", () => {
    const next = applySetQty([row(), row({ id: 20, variantId: 20 })], 20, 4);
    expect(next.find((r) => r.id === 20)?.quantity).toBe(4);
    expect(next.find((r) => r.id === 10)?.quantity).toBe(2);
  });

  it("removes the row when quantity drops below 1", () => {
    expect(applySetQty([row()], 10, 0)).toEqual([]);
  });
});

describe("applyRemove", () => {
  it("drops the matching row and keeps the rest", () => {
    const next = applyRemove([row(), row({ id: 20, variantId: 20 })], 10);
    expect(next.map((r) => r.id)).toEqual([20]);
  });

  it("is a no-op for unknown ids", () => {
    const before = [row()];
    expect(applyRemove(before, 999)).toEqual(before);
  });
});

describe("createLocalCartStorage", () => {
  function memoryLocalStorage() {
    const store = new Map<string, string>();
    return {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    };
  }

  beforeEach(() => {
    vi.stubGlobal("window", { localStorage: memoryLocalStorage() });
  });

  it("round-trips rows through save/load", () => {
    const storage = createLocalCartStorage("test:cart");
    storage.save([row()]);
    expect(storage.load()).toEqual([row()]);
  });

  it("returns null for missing, corrupt, or invalid payloads", () => {
    const storage = createLocalCartStorage("test:cart");
    expect(storage.load()).toBeNull();
    window.localStorage.setItem("test:cart", "not-json{");
    expect(storage.load()).toBeNull();
    window.localStorage.setItem("test:cart", JSON.stringify({ rows: [{ nope: true }] }));
    expect(storage.load()).toBeNull();
  });

  it("clear() empties the stored cart", () => {
    const storage = createLocalCartStorage("test:cart");
    storage.save([row()]);
    storage.clear();
    expect(storage.load()).toBeNull();
  });
});
