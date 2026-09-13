import { describe, expect, it } from "vitest";
import { isOwnerEmail, parseEmailList } from "../server/utils/adminGovernance";

describe("parseEmailList", () => {
  it("splits, trims, lowercases and drops empties", () => {
    expect(parseEmailList("A@x.com, b@Y.com ,,")).toEqual(["a@x.com", "b@y.com"]);
    expect(parseEmailList("")).toEqual([]);
    expect(parseEmailList(undefined)).toEqual([]);
  });
});

describe("isOwnerEmail", () => {
  it("matches owners case-insensitively", () => {
    expect(isOwnerEmail("Owner@X.com", ["owner@x.com"], [])).toBe(true);
    expect(isOwnerEmail("other@x.com", ["owner@x.com"], [])).toBe(false);
  });

  it("falls back to the admin list only while owners is empty", () => {
    expect(isOwnerEmail("a@x.com", [], ["a@x.com"])).toBe(true);
    expect(isOwnerEmail("a@x.com", ["o@x.com"], ["a@x.com"])).toBe(false);
  });

  it("rejects blanks", () => {
    expect(isOwnerEmail("", ["o@x.com"], [])).toBe(false);
    expect(isOwnerEmail(null, ["o@x.com"], [])).toBe(false);
  });
});
