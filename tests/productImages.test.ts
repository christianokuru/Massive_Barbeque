import { describe, expect, it } from "vitest";
import {
  MAX_EXTRA_IMAGES,
  imageUrlSchema,
  isAllowedImageUrl,
} from "../server/utils/productImages";

describe("isAllowedImageUrl", () => {
  it("accepts https URLs and site-relative paths", () => {
    expect(isAllowedImageUrl("https://xyz.supabase.co/storage/v1/object/public/product-images/a.jpg")).toBe(true);
    expect(isAllowedImageUrl("/images/Food/chicken.jpeg")).toBe(true);
  });

  it("rejects XSS vectors and traversal tricks", () => {
    expect(isAllowedImageUrl("javascript:alert(1)")).toBe(false);
    expect(isAllowedImageUrl("data:image/png;base64,AAA")).toBe(false);
    expect(isAllowedImageUrl("//evil.com/x.jpg")).toBe(false);
    expect(isAllowedImageUrl("https://ok.com/a b.jpg")).toBe(false);
    expect(isAllowedImageUrl("/images\\..\\secret")).toBe(false);
    expect(isAllowedImageUrl("")).toBe(false);
    expect(isAllowedImageUrl("http://insecure.com/a.jpg")).toBe(false);
  });

  it("enforces the length cap", () => {
    expect(isAllowedImageUrl(`https://x.com/${"a".repeat(2048)}`)).toBe(false);
  });

  it("exposes a zod schema with the same verdicts", () => {
    expect(imageUrlSchema.safeParse("https://x.com/a.webp").success).toBe(true);
    expect(imageUrlSchema.safeParse("/images/a.png").success).toBe(true);
    expect(imageUrlSchema.safeParse("javascript:alert(1)").success).toBe(false);
  });

  it("caps gallery extras at a sane number", () => {
    expect(MAX_EXTRA_IMAGES).toBe(8);
  });
});
