import { describe, expect, it, vi, beforeEach } from "vitest";
import { confirmUrl, gatewayReturnBase } from "../server/utils/siteUrl";

const APP_URL = "https://massivebarbeque.com";

function mockEvent(host: string | null) {
  (globalThis as any).getHeader = vi.fn((_event: unknown, name: string) =>
    name === "host" ? host : undefined
  );
  (globalThis as any).useRuntimeConfig = vi.fn(() => ({ public: { appUrl: APP_URL } }));
  return {} as any;
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe("gatewayReturnBase", () => {
  it("returns http localhost for local dev hosts", () => {
    expect(gatewayReturnBase(mockEvent("localhost:3000"))).toBe("http://localhost:3000");
    expect(gatewayReturnBase(mockEvent("127.0.0.1:3000"))).toBe("http://127.0.0.1:3000");
  });

  it("uses the canonical app URL for the production host", () => {
    expect(gatewayReturnBase(mockEvent("massivebarbeque.com"))).toBe(APP_URL);
  });

  it("ignores untrusted hosts (no open redirect)", () => {
    expect(gatewayReturnBase(mockEvent("evil.com"))).toBe(APP_URL);
    expect(gatewayReturnBase(mockEvent("massivebarbeque.com.evil.com"))).toBe(APP_URL);
  });

  it("falls back to the app URL without a host", () => {
    expect(gatewayReturnBase(mockEvent(null))).toBe(APP_URL);
  });
});

describe("confirmUrl", () => {
  it("keeps the order id for local dev", () => {
    expect(confirmUrl(mockEvent("localhost:3000"), "order-1")).toBe(
      "http://localhost:3000/checkout/confirm?order=order-1"
    );
  });

  it("omits the query without an order id", () => {
    expect(confirmUrl(mockEvent("localhost:3000"))).toBe("http://localhost:3000/checkout/confirm");
  });

  it("uses the canonical URL in production", () => {
    expect(confirmUrl(mockEvent("massivebarbeque.com"), "order-1")).toBe(
      `${APP_URL}/checkout/confirm?order=order-1`
    );
  });
});
