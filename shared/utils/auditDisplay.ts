// Turn raw audit rows into plain-English lines for the admin audit page.
// Targets are free text written by the server, e.g.
//   status_change  "<order uuid> status:confirmed->preparing payment:pending->failed"
//   product_update "category:sides" | "chicken:variant:MB-CHK-REG" | "chicken:photo-added"
//   settings_change "delivery_fee:2500"
//   refund          "PAY_<uuid> requested" | "PAY_<uuid> refunded"
import { formatNaira } from "./pricing";

export type AuditGroup = "orders" | "catalog" | "money" | "admins" | "settings";

export interface AuditLine {
  group: AuditGroup
  title: string
  detail: string
  /** Admin page this entry concerns, when there is one. */
  href: string | null
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function catalogSubject(target: string): { kind: string; name: string; extra: string } {
  if (target.startsWith("category:")) return { kind: "category", name: target.slice(9), extra: "" };
  const [name, ...rest] = target.split(":");
  return { kind: "product", name: name || target, extra: rest.join(":") };
}

function catalogExtra(extra: string): string {
  if (!extra) return "";
  if (extra === "photo-added") return "added a photo";
  if (extra === "photo-removed") return "removed a photo";
  const [what, sku] = [extra.split(":")[0], extra.split(":").slice(1).join(":")];
  if (what === "variant-added") return `added size ${sku}`;
  if (what === "variant-removed") return `removed size ${sku}`;
  if (what === "variant") return `edited size ${sku}`;
  return extra;
}

export function describeAudit(action: string, target: string): AuditLine {
  const t = String(target ?? "");
  switch (action) {
    case "status_change": {
      const [orderId, ...changes] = t.split(" ");
      const parts = changes.map((c) => {
        const [kind, move] = c.split(":");
        const [from, to] = (move ?? "").split("->");
        return kind === "payment" ? `payment ${from} → ${to}` : `${from} → ${to}`;
      });
      return {
        group: "orders",
        title: "Updated an order",
        detail: parts.join(", ") || "status saved",
        href: UUID.test(orderId ?? "") ? `/admin/orders/${orderId}` : null,
      };
    }
    case "product_create":
    case "product_update":
    case "product_delete": {
      const s = catalogSubject(t);
      const verb = action === "product_create" ? "Created" : action === "product_delete" ? "Deleted" : "Edited";
      const extra = catalogExtra(s.extra);
      return {
        group: "catalog",
        title: `${extra ? "Edited" : verb} ${s.kind}`,
        detail: extra ? `${s.name} — ${extra}` : s.name,
        href: s.kind === "category" ? "/admin/categories" : "/admin/products",
      };
    }
    case "settings_change": {
      const [key, value] = t.split(":");
      if (key === "delivery_fee") {
        return {
          group: "settings",
          title: "Changed delivery fee",
          detail: value ? `now ${formatNaira(Number(value))}` : "updated",
          href: "/admin/settings",
        };
      }
      return { group: "settings", title: "Changed settings", detail: t, href: "/admin/settings" };
    }
    case "refund": {
      const [ref, phase] = t.split(" ");
      return {
        group: "money",
        title: phase === "refunded" ? "Refund completed" : "Refund started",
        detail: ref || t,
        href: "/admin/payments",
      };
    }
    case "promote":
      return { group: "admins", title: "Made admin", detail: t, href: "/admin/admins" };
    case "demote":
      return { group: "admins", title: "Removed admin", detail: t, href: "/admin/admins" };
    case "invite":
      return { group: "admins", title: "Invited admin", detail: t, href: "/admin/admins" };
    case "invite_consumed":
      return { group: "admins", title: "Admin invite used", detail: t, href: "/admin/admins" };
    case "invite_revoked":
      return { group: "admins", title: "Admin invite cancelled", detail: t, href: "/admin/admins" };
    default:
      return { group: "settings", title: action, detail: t, href: null };
  }
}
