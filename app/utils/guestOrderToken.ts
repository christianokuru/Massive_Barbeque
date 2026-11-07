// Guest proof for order-scoped reads: issued at order-create and kept in
// localStorage for the token's 30-day life, so it survives the gateway
// round-trip even when payment finishes in a new tab or a banking app.
// Logged-in buyers don't need it — the session is their proof.
//
// Stored as `mb:guest:<orderId>` → {"t": token, "x": expiryMs}. Older
// builds kept the bare token in sessionStorage; that is still read.

const PREFIX = "mb:guest:";
const TTL_MS = 30 * 24 * 3600 * 1000; // matches GUEST_TOKEN_TTL_SECS (server)
const MAX_ENTRIES = 50;

function local(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

function readEntry(raw: string | null): { t: string; x: number } | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    if (v && typeof v.t === "string" && typeof v.x === "number") return v;
  } catch {
    // not JSON
  }
  return null;
}

/** Drop expired entries and cap how many are kept (oldest expiry first). */
function prune(store: Storage) {
  const live: Array<{ key: string; x: number }> = [];
  for (let i = store.length - 1; i >= 0; i--) {
    const key = store.key(i);
    if (!key || !key.startsWith(PREFIX)) continue;
    const entry = readEntry(store.getItem(key));
    if (!entry || entry.x <= Date.now()) store.removeItem(key);
    else live.push({ key, x: entry.x });
  }
  live.sort((a, b) => a.x - b.x);
  while (live.length > MAX_ENTRIES) store.removeItem(live.shift()!.key);
}

export function saveGuestToken(id: string, token: string): void {
  if (!id || !token) return;
  const store = local();
  try {
    if (store) {
      store.setItem(PREFIX + id, JSON.stringify({ t: token, x: Date.now() + TTL_MS }));
      prune(store);
      return;
    }
  } catch {
    // Storage full / blocked — fall back to this tab only.
  }
  try {
    sessionStorage.setItem(PREFIX + id, token);
  } catch {
    // Private mode: the guest can still pay now; reading later may 404.
  }
}

export function guestTokenForOrder(id: string | undefined): string | undefined {
  if (!id) return undefined;
  const store = local();
  try {
    const entry = readEntry(store?.getItem(PREFIX + id) ?? null);
    if (entry && entry.x > Date.now()) return entry.t;
  } catch {
    // fall through
  }
  try {
    return typeof sessionStorage === "undefined"
      ? undefined
      : sessionStorage.getItem(PREFIX + id) ?? undefined;
  } catch {
    return undefined;
  }
}
