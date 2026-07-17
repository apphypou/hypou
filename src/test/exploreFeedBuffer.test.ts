import { describe, expect, it } from "vitest";

const mergeUniqueItems = <T extends { id: string }>(primary: T[], fallback: T[]) => {
  const seen = new Set(primary.map((item) => item.id));
  return [...primary, ...fallback.filter((item) => !seen.has(item.id))];
};

describe("explore feed buffer", () => {
  it("fills a tiny recommended feed with fallback items without duplicates", () => {
    const result = mergeUniqueItems([{ id: "a" }], [{ id: "a" }, { id: "b" }, { id: "c" }]);
    expect(result.map((item) => item.id)).toEqual(["a", "b", "c"]);
  });
});
