import { describe, expect, it } from "vitest";
import { clampCropOffset, clampPercent, getMediaObjectPosition, getMediaScale } from "@/lib/mediaFrame";

describe("media frame focal point", () => {
  it("defaults to centered media", () => {
    expect(getMediaObjectPosition(null)).toBe("50% 50%");
    expect(getMediaObjectPosition({})).toBe("50% 50%");
  });

  it("uses persisted focal point values", () => {
    expect(getMediaObjectPosition({ focal_x: 42, focal_y: 61 })).toBe("42% 61%");
  });

  it("uses the persisted crop zoom within safe limits", () => {
    expect(getMediaScale({ focal_scale: 2.4 })).toBe(2.4);
    expect(getMediaScale({ focal_scale: 9 })).toBe(4);
    expect(getMediaScale({ focal_scale: 0.5 })).toBe(1);
  });

  it("clamps invalid percent values", () => {
    expect(clampPercent(-20)).toBe(0);
    expect(clampPercent(140)).toBe(100);
    expect(clampPercent("nope", 50)).toBe(50);
  });

  it("keeps a dragged crop inside the image bounds", () => {
    expect(clampCropOffset({
      imageWidth: 4_000,
      imageHeight: 3_000,
      viewportWidth: 400,
      viewportHeight: 500,
      zoom: 1,
      x: 400,
      y: -400,
    })).toEqual({ x: 133.33, y: 0 });
  });
});
