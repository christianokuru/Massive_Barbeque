// Guest proof for order-scoped reads: issued at order-create, kept in
// sessionStorage (survives the gateway round-trip in the same tab).
// Logged-in buyers don't need it — the session is their proof.
export function guestTokenForOrder(id: string | undefined): string | undefined {
  if (!id || typeof sessionStorage === "undefined") return undefined;
  try {
    return sessionStorage.getItem(`mb:guest:${id}`) ?? undefined;
  } catch {
    return undefined;
  }
}
