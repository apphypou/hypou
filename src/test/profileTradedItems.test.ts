import { describe, expect, it } from "vitest";
import { isTradedProfileItem, sortProfileItemsByTradeStatus } from "@/lib/profileItems";

describe("isTradedProfileItem", () => {
  it("marks item as traded when it belongs to a completed match", () => {
    expect(isTradedProfileItem({ id: "item-1", status: "inactive" }, new Set(["item-1"]))).toBe(true);
  });

  it("does not mark merely active items as traded", () => {
    expect(isTradedProfileItem({ id: "item-2", status: "active" }, new Set(["item-1"]))).toBe(false);
  });

  it("places traded items after active items without changing each group's order", () => {
    const ordered = sortProfileItemsByTradeStatus([
      { id: "traded-newer", is_traded: true },
      { id: "active-newer", is_traded: false },
      { id: "traded-older", is_traded: true },
      { id: "active-older", is_traded: false },
    ]);

    expect(ordered.map((item) => item.id)).toEqual([
      "active-newer",
      "active-older",
      "traded-newer",
      "traded-older",
    ]);
  });
});
