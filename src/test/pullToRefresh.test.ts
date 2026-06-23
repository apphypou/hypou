import { describe, expect, it } from "vitest";
import {
  findRefreshIndex,
  getPullDirection,
  isPullRefreshExcluded,
  isScrollAtTop,
} from "@/lib/pullToRefresh";

describe("pull-to-refresh helpers", () => {
  it("locks only a dominant downward pull", () => {
    expect(getPullDirection(10, 40)).toBe("vertical");
    expect(getPullDirection(40, 10)).toBe("horizontal");
    expect(getPullDirection(0, -20)).toBe("cancelled");
  });

  it("requires the active scroll container to be at the top", () => {
    const node = document.createElement("div");
    Object.defineProperty(node, "scrollTop", { value: 0, configurable: true });
    expect(isScrollAtTop(node)).toBe(true);
    Object.defineProperty(node, "scrollTop", { value: 12, configurable: true });
    expect(isScrollAtTop(node)).toBe(false);
  });

  it("excludes editing controls and marked overlays", () => {
    const input = document.createElement("input");
    const overlay = document.createElement("div");
    overlay.dataset.pullRefreshDisabled = "true";
    const child = document.createElement("span");
    overlay.appendChild(child);

    expect(isPullRefreshExcluded(input)).toBe(true);
    expect(isPullRefreshExcluded(child)).toBe(true);
  });

  it("keeps the same listing after feed reorder", () => {
    expect(findRefreshIndex([{ id: "c" }, { id: "a" }], "a", 0)).toBe(1);
  });

  it("uses the nearest valid index when the listing disappears", () => {
    expect(findRefreshIndex([{ id: "a" }, { id: "b" }], "missing", 4)).toBe(1);
    expect(findRefreshIndex([], "missing", 4)).toBe(0);
  });
});
