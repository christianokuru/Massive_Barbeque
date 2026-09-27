// URL slug helper shared by admin UI and API (single implementation —
// the client dialog previously carried its own copy).

/** Lowercase, strip punctuation, spaces → single dashes. */
export function slugify(value: string): string {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}
