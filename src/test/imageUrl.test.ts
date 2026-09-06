import { describe, expect, it } from "vitest";
import { cdnBlur } from "@/lib/imageUrl";

describe("Explore backdrop image", () => {
  it("requests a proportional thumbnail instead of a narrow cover crop", () => {
    const url = new URL(cdnBlur("https://example.test/storage/v1/object/public/items/photo.jpg"));
    expect(url.pathname).toBe("/storage/v1/render/image/public/items/photo.jpg");
    expect(url.searchParams.get("width")).toBe("64");
    expect(url.searchParams.get("resize")).toBe("contain");
    expect(url.searchParams.has("height")).toBe(false);
  });

  it("preserves non-storage images", () => {
    expect(cdnBlur("/photo.jpg")).toBe("/photo.jpg");
    expect(cdnBlur(null)).toBe("");
  });
});
