import { describe, expect, it } from "vitest";
import { shouldRecycleExploreFeed } from "@/lib/exploreFeed";

describe("shouldRecycleExploreFeed", () => {
  it("recycles only when a loaded feed has no remaining visible cards", () => {
    expect(shouldRecycleExploreFeed(3, 0, false)).toBe(true);
  });

  it("does not recycle while loading or while a card remains", () => {
    expect(shouldRecycleExploreFeed(3, 0, true)).toBe(false);
    expect(shouldRecycleExploreFeed(3, 1, false)).toBe(false);
    expect(shouldRecycleExploreFeed(0, 0, false)).toBe(false);
  });
});
