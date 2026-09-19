// Proxy-aware client IP. `getRequestIP()` trusts X-Forwarded-For
// unconditionally, so behind an untrusted proxy an attacker rotates the
// header per request for a fresh rate-limit bucket. This helper prefers
// the socket address when it is a public IP, and only falls back to the
// first X-Forwarded-For entry when the socket is loopback/private (i.e.
// the app sits behind a local proxy/CDN that sets the header).

export function normalizeIp(raw: unknown): string {
  let ip = String(raw || "").trim();
  if (!ip) return "";
  // Strip IPv4-mapped IPv6 prefix and zone ids / ports.
  if (ip.startsWith("::ffff:")) ip = ip.slice("::ffff:".length);
  const pct = ip.indexOf("%");
  if (pct >= 0) ip = ip.slice(0, pct);
  if (ip.startsWith("[") && ip.endsWith("]")) ip = ip.slice(1, -1);
  return ip;
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const v = Number(p);
    if (v > 255) return null;
    n = n * 256 + v;
  }
  return n >>> 0;
}

export function isLoopbackOrPrivate(ip: string): boolean {
  const norm = normalizeIp(ip);
  if (!norm) return true;
  if (norm === "::1" || norm === "::") return true;
  const lower = norm.toLowerCase();
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique-local
  if (lower.startsWith("fe80:")) return true; // link-local
  const n = ipv4ToInt(norm);
  if (n === null) return true; // unknown family — treat as untrusted proxy
  if ((n >>> 24) === 127) return true; // loopback
  if ((n >>> 24) === 10) return true; // 10/8
  if ((n >>> 20) === 0xac1) return true; // 172.16/12
  if ((n >>> 16) === 0xc0a8) return true; // 192.168/16
  if ((n >>> 16) === 0xa9fe) return true; // 169.254/16 link-local
  return false;
}

export function isValidPublicIp(ip: string): boolean {
  const norm = normalizeIp(ip);
  if (!norm) return false;
  if (norm.includes(":")) {
    // IPv6: accept only global unicast (not loopback/private/link-local).
    return !isLoopbackOrPrivate(norm);
  }
  return ipv4ToInt(norm) !== null && !isLoopbackOrPrivate(norm);
}

function headerOf(event: any, name: string): string {
  // Framework-free header read (works in Nuxt and in vitest fakes).
  const headers = event?.node?.req?.headers || {};
  const value =
    headers[name] ?? headers[name.toLowerCase()] ?? headers[name.toUpperCase()];
  return Array.isArray(value) ? String(value[0] || "") : String(value || "");
}

export function getClientIp(event: any): string {
  const socketIp = normalizeIp(event?.node?.req?.socket?.remoteAddress || "");
  if (socketIp && !isLoopbackOrPrivate(socketIp)) return socketIp;
  // Behind a local proxy: trust the leftmost X-Forwarded-For entry, but
  // only if it parses as a real IP address.
  const xff = headerOf(event, "x-forwarded-for").split(",")[0].trim();
  const norm = normalizeIp(xff);
  if (norm && (ipv4ToInt(norm) !== null || norm.includes(":"))) return norm;
  const realIp = normalizeIp(headerOf(event, "x-real-ip"));
  if (realIp && (ipv4ToInt(realIp) !== null || realIp.includes(":"))) return realIp;
  return socketIp || "unknown";
}
