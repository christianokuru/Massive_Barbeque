import type { CartRefreshResult } from "~/composables/useCart";

/** Plain-English note after the cart was synced with the live menu. */
export function cartChangeNotice(r: CartRefreshResult): string {
  const parts: string[] = [];
  if (r.removed.length) {
    const names = r.removed.map((i) => [i.name, i.variantName].filter(Boolean).join(" – ") || "An item");
    parts.push(`${names.join(", ")} ${names.length === 1 ? "is" : "are"} no longer on the menu and ${names.length === 1 ? "was" : "were"} removed.`);
  }
  if (r.priceChanged) parts.push("Some prices changed since you added them — totals are updated.");
  return parts.join(" ");
}
