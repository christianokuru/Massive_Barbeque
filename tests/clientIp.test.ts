import { describe, expect, it } from "vitest";
import {
  getClientIp,
  isLoopbackOrPrivate,
  isValidPublicIp,
  normalizeIp,
} from "../server/utils/clientIp";

function fakeEvent(socketIp?: string, xff?: string): any {
  return {
    node: { req: { socket: { remoteAddress: socketIp }, headers: xff ? { "x-forwarded-for": xff } : {} } },
  };
}

describe("normalizeIp", () => {
  it("strips IPv4-mapped prefix and brackets", () => {
    expect(normalizeIp("::ffff:1.2.3.4")).toBe("1.2.3.4");
    expect(normalizeIp("[::1]")).toBe("::1");
    expect(normalizeIp("  9.9.9.9 ")).toBe("9.9.9.9");
  });
});

describe("isLoopbackOrPrivate", () => {
  it("flags loopback, private, and link-local ranges", () => {
    expect(isLoopbackOrPrivate("127.0.0.1")).toBe(true);
    expect(isLoopbackOrPrivate("10.1.2.3")).toBe(true);
    expect(isLoopbackOrPrivate("192.168.0.5")).toBe(true);
    expect(isLoopbackOrPrivate("172.16.9.9")).toBe(true);
    expect(isLoopbackOrPrivate("172.31.255.255")).toBe(true);
    expect(isLoopbackOrPrivate("::1")).toBe(true);
    expect(isLoopbackOrPrivate("8.8.8.8")).toBe(false);
    expect(isLoopbackOrPrivate("172.32.0.1")).toBe(false);
  });
});

describe("isValidPublicIp", () => {
  it("accepts public IPs only", () => {
    expect(isValidPublicIp("8.8.8.8")).toBe(true);
    expect(isValidPublicIp("10.0.0.1")).toBe(false);
    expect(isValidPublicIp("not-an-ip")).toBe(false);
  });
});

describe("getClientIp", () => {
  it("prefers a public socket IP over XFF", () => {
    expect(getClientIp(fakeEvent("8.8.8.8", "1.1.1.1"))).toBe("8.8.8.8");
  });

  it("falls back to XFF only behind a loopback/private socket", () => {
    expect(getClientIp(fakeEvent("127.0.0.1", "1.1.1.1, 10.0.0.1"))).toBe("1.1.1.1");
    // Attacker header is ignored when the socket is directly public.
    expect(getClientIp(fakeEvent("8.8.8.8", "9.9.9.9"))).toBe("8.8.8.8");
  });

  it("ignores garbage XFF values", () => {
    const ip = getClientIp(fakeEvent("127.0.0.1", "garbage!!"));
    expect(ip).not.toBe("garbage!!");
  });
});
