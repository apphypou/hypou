import { describe, expect, it } from "vitest";
import { clampPercent, getMediaObjectPosition } from "@/lib/mediaFrame";

describe("media frame focal point", () => {
  it("defaults to centered media", () => {
    expect(getMediaObjectPosition(null)).toBe("50% 50%");
    expect(getMediaObjectPosition({})).toBe("50% 50%");
  });

  it("uses persisted focal point values", () => {
    expect(getMediaObjectPosition({ focal_x: 42, focal_y: 61 })).toBe("42% 61%");
  });

  it("clamps invalid percent values", () => {
    expect(clampPercent(-20)).toBe(0);
    expect(clampPercent(140)).toBe(100);
    expect(clampPercent("nope", 50)).toBe(50);
  });
});

