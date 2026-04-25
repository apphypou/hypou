import { describe, it, expect } from "vitest";
import { categories, conditions } from "@/constants/categories";

describe("categories e conditions", () => {
  it("01 categories tem ≥10 itens", () => {
    expect(categories.length).toBeGreaterThanOrEqual(10);
  });
  it("02 toda categoria tem emoji e label", () => {
    categories.forEach((c) => {
      expect(c.emoji.length).toBeGreaterThan(0);
      expect(c.label.length).toBeGreaterThan(0);
    });
  });
  it("03 inclui Outros como fallback", () => {
    expect(categories.some((c) => c.label === "Outros")).toBe(true);
  });
  it("04 conditions tem 4 níveis", () => {
    expect(conditions.length).toBe(4);
  });
  it("05 conditions cobre new/like_new/used/worn", () => {
    const values = conditions.map((c) => c.value);
    expect(values).toContain("new");
    expect(values).toContain("like_new");
    expect(values).toContain("used");
    expect(values).toContain("worn");
  });
  it("06 nenhum label de categoria duplicado", () => {
    const labels = categories.map((c) => c.label);
    expect(new Set(labels).size).toBe(labels.length);
  });
});
