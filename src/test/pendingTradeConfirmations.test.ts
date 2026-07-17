import { describe, expect, it } from "vitest";
import { getTradeConfirmationState } from "@/lib/tradeConfirmation";

describe("getTradeConfirmationState", () => {
  it("is true when the other side confirmed and I have not", () => {
    expect(
      getTradeConfirmationState({
        status: "accepted",
        my_item_side: "a",
        confirmed_by_a: false,
        confirmed_by_b: true,
      }).needsMyConfirmation,
    ).toBe(true);
  });

  it("is false when I already confirmed", () => {
    expect(
      getTradeConfirmationState({
        status: "accepted",
        my_item_side: "a",
        confirmed_by_a: true,
        confirmed_by_b: true,
      }).needsMyConfirmation,
    ).toBe(false);
  });
});
