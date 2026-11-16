import { describe, expect, it } from "vitest";
import { describeAudit } from "../shared/utils/auditDisplay";

const ID = "49986c27-747d-4f95-adbe-1691d32e694c";

describe("describeAudit", () => {
  it("explains order moves and links to the order", () => {
    const l = describeAudit("status_change", `${ID} status:confirmed->preparing payment:pending->failed`);
    expect(l.group).toBe("orders");
    expect(l.detail).toBe("confirmed → preparing, payment pending → failed");
    expect(l.href).toBe(`/admin/orders/${ID}`);
  });
  it("handles old entries that only stored the order id", () => {
    expect(describeAudit("status_change", ID).detail).toBe("status saved");
  });
  it("names categories, products and sizes", () => {
    expect(describeAudit("product_update", "category:sides")).toMatchObject({ title: "Edited category", detail: "sides" });
    expect(describeAudit("product_delete", "chicken")).toMatchObject({ title: "Deleted product", detail: "chicken" });
    expect(describeAudit("product_update", "chicken:variant-added:MB-CHK-XL").detail).toBe("chicken — added size MB-CHK-XL");
  });
  it("formats the delivery fee", () => {
    expect(describeAudit("settings_change", "delivery_fee:2500").detail).toBe("now ₦2,500");
  });
  it("distinguishes refund phases", () => {
    expect(describeAudit("refund", "PAY_x requested").title).toBe("Refund started");
    expect(describeAudit("refund", "PAY_x refunded").title).toBe("Refund completed");
  });
});
