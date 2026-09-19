import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "../app/utils/safeRedirect";

describe("safeRedirectPath", () => {
  it("allows plain internal paths", () => {
    expect(safeRedirectPath("/menu")).toBe("/menu");
    expect(safeRedirectPath("/dashboard/orders")).toBe("/dashboard/orders");
  });

  it("rejects absolute, protocol-relative, and encoded escapes", () => {
    expect(safeRedirectPath("https://evil.com")).toBeNull();
    expect(safeRedirectPath("//evil.com")).toBeNull();
    expect(safeRedirectPath("/%2F%2Fevil.com")).toBeNull();
    expect(safeRedirectPath("/\\evil.com")).toBeNull();
    expect(safeRedirectPath("")).toBeNull();
  });
});
