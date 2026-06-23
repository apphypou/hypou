import { describe, expect, it } from "vitest";
import { shouldHideBottomNav } from "@/lib/bottomNavVisibility";

describe("bottom nav visibility", () => {
  it("hides nav on full-screen conversation and item routes", () => {
    expect(shouldHideBottomNav("/conversa/abc", false)).toBe(true);
    expect(shouldHideBottomNav("/item/abc", false)).toBe(true);
  });

  it("hides nav behind blocking overlays", () => {
    expect(shouldHideBottomNav("/explorar", true)).toBe(true);
  });

  it("shows nav on normal tab routes", () => {
    expect(shouldHideBottomNav("/explorar", false)).toBe(false);
    expect(shouldHideBottomNav("/chat", false)).toBe(false);
  });
});
