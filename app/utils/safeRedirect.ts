// Internal-redirect guard for post-auth navigation (?redirect=).
// Returns the path when it is provably same-origin, else null.
export function safeRedirectPath(raw: unknown): string | null {
  const redirect = String(raw || "");
  if (!redirect.startsWith("/") || redirect.startsWith("//")) return null;
  let decoded = redirect;
  try {
    decoded = decodeURIComponent(redirect);
  } catch {
    return null;
  }
  if (!decoded.startsWith("/") || decoded.startsWith("//")) return null;
  if (decoded.includes("\\")) return null;
  try {
    const parsed = new URL(decoded, "https://massivebarbeque.com");
    if (parsed.origin !== "https://massivebarbeque.com") return null;
    const scheme = parsed.pathname.toLowerCase();
    if (scheme.startsWith("javascript:") || scheme.startsWith("data:")) return null;
  } catch {
    return null;
  }
  return redirect;
}
