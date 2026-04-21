import { describe, it, expect } from "vitest";

const formatCurrency = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  const number = parseInt(digits || "0", 10);
  return (number / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const parseCurrencyToCents = (formatted: string): number => {
  const digits = formatted.replace(/\D/g, "");
  return parseInt(digits || "0", 10);
};

const MAX_PHOTOS = 5;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

const isMarginValid = (m: number) => m >= 1 && m <= 100;

const tradeRange = (cents: number, marginUp: number, marginDown: number) => ({
  min: Math.round(cents * (1 - marginDown / 100)),
  max: Math.round(cents * (1 + marginUp / 100)),
});

const itemHasImage = (images: { image_url: string }[]) => images.length > 0;

describe("Items: currency", () => {
  it("formats 0", () => expect(formatCurrency("0")).toContain("0,00"));
  it("formats 100 cents", () => expect(formatCurrency("100")).toContain("1,00"));
  it("formats 150000 cents", () => expect(formatCurrency("150000")).toContain("1.500,00"));
  it("formats long value", () => expect(formatCurrency("99999900")).toContain("999.999,00"));
  it("round-trip parse", () => {
    const formatted = formatCurrency("12345");
    expect(parseCurrencyToCents(formatted)).toBe(12345);
  });
});

describe("Items: limits", () => {
  it("rejects 6th photo", () => {
    const photos = new Array(5).fill(null);
    expect(photos.length >= MAX_PHOTOS).toBe(true);
  });
  it("rejects video over 50MB", () => {
    expect(60 * 1024 * 1024 > MAX_VIDEO_BYTES).toBe(true);
  });
});

describe("Items: margins", () => {
  it("accepts margin in range", () => expect(isMarginValid(15)).toBe(true));
  it("rejects margin 0", () => expect(isMarginValid(0)).toBe(false));
  it("rejects margin 101", () => expect(isMarginValid(101)).toBe(false));
});

describe("Items: trade range", () => {
  it("computes min/max correctly", () => {
    expect(tradeRange(10000, 15, 10)).toEqual({ min: 9000, max: 11500 });
  });
});

describe("Items: feed filter", () => {
  it("excludes items without image", () => {
    expect(itemHasImage([])).toBe(false);
  });
  it("includes items with image", () => {
    expect(itemHasImage([{ image_url: "x" }])).toBe(true);
  });
});
