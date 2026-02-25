import { describe, it, expect } from "vitest";

// Test utility functions extracted from itemService / NovoItem patterns
const formatCurrency = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  const number = parseInt(digits || "0", 10);
  return (number / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const parseCurrencyToCents = (formatted: string): number => {
  const digits = formatted.replace(/\D/g, "");
  return parseInt(digits || "0", 10);
};

describe("Currency formatting", () => {
  it("should format zero correctly", () => {
    expect(formatCurrency("")).toContain("0,00");
  });

  it("should format 1500 cents as R$ 15,00", () => {
    expect(formatCurrency("1500")).toContain("15,00");
  });

  it("should format 150000 cents as R$ 1.500,00", () => {
    expect(formatCurrency("150000")).toContain("1.500,00");
  });

  it("should strip non-digit characters", () => {
    // "R$ 1.500,00" -> digits "150000" -> 1500.00 -> "R$ 1.500,00"
    expect(formatCurrency("R$ 1.500,00")).toContain("1.500,00");
  });
});

describe("Currency parsing to cents", () => {
  it("should return 0 for empty string", () => {
    expect(parseCurrencyToCents("")).toBe(0);
  });

  it("should parse R$ 15,00 to 1500", () => {
    expect(parseCurrencyToCents("R$ 15,00")).toBe(1500);
  });

  it("should parse R$ 1.500,00 to 150000", () => {
    expect(parseCurrencyToCents("R$ 1.500,00")).toBe(150000);
  });
});

// Test value margin overlap logic (from check_for_match DB function)
const checkMarginOverlap = (
  valueA: number, marginUpA: number, marginDownA: number,
  valueB: number, marginUpB: number, marginDownB: number,
): boolean => {
  const aMin = valueA * (1 - marginDownA / 100);
  const aMax = valueA * (1 + marginUpA / 100);
  const bMin = valueB * (1 - marginDownB / 100);
  const bMax = valueB * (1 + marginUpB / 100);
  return !(aMax < bMin || bMax < aMin);
};

describe("Value margin overlap", () => {
  it("should match items with same value", () => {
    expect(checkMarginOverlap(10000, 15, 10, 10000, 15, 10)).toBe(true);
  });

  it("should match items within margin range", () => {
    // A: 10000 range [9000, 11500]
    // B: 11000 range [9900, 12650]
    expect(checkMarginOverlap(10000, 15, 10, 11000, 15, 10)).toBe(true);
  });

  it("should not match items too far apart", () => {
    // A: 10000 range [9000, 11500]
    // B: 20000 range [18000, 23000]
    expect(checkMarginOverlap(10000, 15, 10, 20000, 15, 10)).toBe(false);
  });

  it("should match with high margins", () => {
    expect(checkMarginOverlap(10000, 50, 50, 14000, 50, 50)).toBe(true);
  });
});
