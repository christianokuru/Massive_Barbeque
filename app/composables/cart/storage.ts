// localStorage persistence for the cart module. SSR-safe (no-ops
// without `window`), versioned envelope, never throws — a broken cache
// must never break the shop.

import type { CartRow, CartStorage } from "./types";

const ENVELOPE_VERSION = 1;

function storageAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isRow(value: unknown): value is CartRow {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  // Strict shape: poisoned rows (object prices, giant strings, absurd
  // quantities) are dropped instead of persisting into the UI.
  if (typeof row.variantId !== "number" || !Number.isInteger(row.variantId)) return false;
  if (typeof row.quantity !== "number" || !Number.isFinite(row.quantity)) return false;
  if (row.price !== undefined && typeof row.price !== "string" && typeof row.price !== "number") {
    return false;
  }
  if (typeof row.price === "string" && row.price.length > 32) return false;
  for (const key of ["name", "variantName", "sku", "imageUrl"] as const) {
    const v = row[key];
    if (v !== undefined && v !== null && (typeof v !== "string" || (v as string).length > 500)) {
      return false;
    }
  }
  return true;
}

export function createLocalCartStorage(key = "mb:cart:v1"): CartStorage {
  return {
    load(): CartRow[] | null {
      if (!storageAvailable()) return null;
      try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return null;
        const parsed: unknown = JSON.parse(raw);
        const rows = Array.isArray(parsed)
          ? parsed
          : (parsed as { rows?: unknown } | null)?.rows;
        if (!Array.isArray(rows)) return null;
        const valid = rows.filter(isRow).slice(0, 50);
        return valid.length ? valid : null;
      } catch {
        return null;
      }
    },

    save(rows: CartRow[]): void {
      if (!storageAvailable()) return;
      try {
        window.localStorage.setItem(
          key,
          JSON.stringify({ v: ENVELOPE_VERSION, savedAt: Date.now(), rows }),
        );
      } catch {
        // Quota / private mode — the server remains the source of truth.
      }
    },

    clear(): void {
      if (!storageAvailable()) return;
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Intentionally ignored (see save).
      }
    },
  };
}
