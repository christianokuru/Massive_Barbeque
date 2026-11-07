import { describe, expect, it } from "vitest";
import { classifyRefund } from "../shared/utils/refundState";

describe("classifyRefund", () => {
  it("reads Paystack refund states", () => {
    expect(classifyRefund("paystack", { status: true, data: { status: "processed" } })).toBe("done");
    expect(classifyRefund("paystack", { status: true, data: { status: "pending" } })).toBe("pending");
    expect(classifyRefund("paystack", { status: true, data: { status: "processing" } })).toBe("pending");
    expect(classifyRefund("paystack", { status: true, data: { status: "needs-attention" } })).toBe("pending");
    expect(classifyRefund("paystack", { status: true, data: { status: "failed" } })).toBe("failed");
    expect(classifyRefund("paystack", { status: false, message: "Transaction has been fully reversed" })).toBe("rejected");
  });

  it("treats Flutterwave 'completed' as done", () => {
    expect(classifyRefund("flutterwave", { status: "success", data: { status: "completed" } })).toBe("done");
    expect(classifyRefund("flutterwave", { status: "success", data: { status: "successful" } })).toBe("done");
    expect(classifyRefund("flutterwave", { status: "success", data: { status: "pending" } })).toBe("pending");
    expect(classifyRefund("flutterwave", { status: "error", message: "nope" })).toBe("rejected");
  });

  it("never assumes money moved on unknown or missing answers", () => {
    expect(classifyRefund("paystack", null)).toBe("rejected");
    expect(classifyRefund("flutterwave", { status: "success", data: {} })).toBe("pending");
    expect(classifyRefund("paystack", { status: true, data: { status: "weird" } })).toBe("pending");
  });
});
