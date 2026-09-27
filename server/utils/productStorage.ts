const BUCKET = "product-images";
const BUCKET_MARKER = "/product-images/";

// Our bucket files are addressable inside the public URL; seeded local
// paths and external URLs are not. Returns the in-bucket path or null.
export function storagePathForUrl(imageUrl: string): string | null {
  if (typeof imageUrl !== "string") return null;
  const markerAt = imageUrl.indexOf(BUCKET_MARKER);
  if (markerAt === -1) return null;
  const path = imageUrl.slice(markerAt + BUCKET_MARKER.length).split("?")[0];
  if (!path || path.includes("..")) return null;
  return path;
}

// Best-effort single-file removal: orphan files at worst are never worth
// failing a catalog write over.
export async function removeStoragePath(admin: any, path: string): Promise<void> {
  try {
    await admin.storage.from(BUCKET).remove([path]);
  } catch {
    // Orphan file at worst — the catalog row is already gone.
  }
}

/** Remove every bucket file referenced by the given image URLs. */
export async function removeStorageUrls(admin: any, urls: Array<string | null | undefined>): Promise<void> {
  for (const url of urls) {
    const path = url ? storagePathForUrl(url) : null;
    if (path) await removeStoragePath(admin, path);
  }
}
