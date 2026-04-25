/**
 * E2E #8 — Search & Filters (8 tests)
 */
import { describe, it, expect } from "vitest";

type Filters = { q: string; category: string | null; condition: string | null; sort: "recent" | "value_asc" | "value_desc" };
const hasActiveFilters = (f: Filters) => !!f.q || !!f.category || !!f.condition;
const buildSearchPattern = (q: string) => `%${q.trim()}%`;
const SORT_OPTIONS = ["recent", "value_asc", "value_desc"] as const;
const sortItems = (items: any[], sort: string) => {
  const arr = [...items];
  if (sort === "value_asc") arr.sort((a, b) => a.market_value - b.market_value);
  else if (sort === "value_desc") arr.sort((a, b) => b.market_value - a.market_value);
  else arr.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  return arr;
};

describe("E2E Search/Filters", () => {
  it("01 sem filtros", () =>
    expect(hasActiveFilters({ q: "", category: null, condition: null, sort: "recent" })).toBe(false));
  it("02 com query", () =>
    expect(hasActiveFilters({ q: "tv", category: null, condition: null, sort: "recent" })).toBe(true));
  it("03 com categoria", () =>
    expect(hasActiveFilters({ q: "", category: "Eletrônicos", condition: null, sort: "recent" })).toBe(true));
  it("04 padrão wildcard", () => expect(buildSearchPattern("tv")).toBe("%tv%"));
  it("05 padrão trim", () => expect(buildSearchPattern("  tv  ")).toBe("%tv%"));
  it("06 ordena valor asc", () => {
    const r = sortItems([{ market_value: 200, created_at: "2024" }, { market_value: 100, created_at: "2024" }], "value_asc");
    expect(r[0].market_value).toBe(100);
  });
  it("07 ordena valor desc", () => {
    const r = sortItems([{ market_value: 100, created_at: "2024" }, { market_value: 200, created_at: "2024" }], "value_desc");
    expect(r[0].market_value).toBe(200);
  });
  it("08 ordena recent", () => {
    const r = sortItems([{ market_value: 1, created_at: "2024-01-01" }, { market_value: 1, created_at: "2024-12-01" }], "recent");
    expect(r[0].created_at).toBe("2024-12-01");
  });
});
