import { describe, expect, it } from "vitest";
import {
  GUEST_TOKEN_TTL_SECS,
  issueGuestToken,
  verifyGuestToken,
} from "../server/utils/guestToken";

const SECRET = "test-secret-123";

describe("guestToken", () => {
  it("issues and verifies a token for the same order", () => {
    const token = issueGuestToken("order-1", "Guest@X.com", SECRET, 3600, 1000);
    expect(verifyGuestToken(token, "order-1", SECRET, 2000)).toEqual({
      email: "guest@x.com",
    });
  });

  it("rejects wrong order, wrong secret, and tampered payloads", () => {
    const token = issueGuestToken("order-1", "a@x.com", SECRET, 3600, 1000);
    expect(verifyGuestToken(token, "order-2", SECRET, 2000)).toBeNull();
    expect(verifyGuestToken(token, "order-1", "other-secret", 2000)).toBeNull();
    const [payload, sig] = token.split(".");
    const tampered = `${payload.slice(0, -2)}XX.${sig}`;
    expect(verifyGuestToken(tampered, "order-1", SECRET, 2000)).toBeNull();
    expect(verifyGuestToken("garbage", "order-1", SECRET, 2000)).toBeNull();
    expect(verifyGuestToken("", "order-1", SECRET, 2000)).toBeNull();
  });

  it("rejects expired tokens", () => {
    const token = issueGuestToken("order-1", "a@x.com", SECRET, 60, 1000);
    expect(verifyGuestToken(token, "order-1", SECRET, 1061)).toBeNull();
    expect(verifyGuestToken(token, "order-1", SECRET, 1059)).not.toBeNull();
  });

  it("has a 30-day default TTL", () => {
    expect(GUEST_TOKEN_TTL_SECS).toBe(30 * 24 * 3600);
  });
});
