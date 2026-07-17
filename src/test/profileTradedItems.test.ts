import { describe, expect, it } from "vitest";
import { isTradedProfileItem } from "@/lib/profileItems";

describe("isTradedProfileItem", () => {
  it("marks item as traded when it belongs to a completed match", () => {
    expect(isTradedProfileItem({ id: "item-1", status: "inactive" }, new Set(["item-1"]))).toBe(true);
  });

  it("does not mark merely active items as traded", () => {
    expect(isTradedProfileItem({ id: "item-2", status: "active" }, new Set(["item-1"]))).toBe(false);
  });
});
