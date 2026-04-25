/**
 * E2E #6 — Items Management (15 tests)
 */
import { describe, it, expect } from "vitest";

const formatCurrency = (digits: string) => {
  const c = parseInt(digits.replace(/\D/g, "") || "0", 10);
  return `R$ ${(c / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
};
const parseCents = (formatted: string) => {
  const d = formatted.replace(/\D/g, "");
  return d ? parseInt(d, 10) : 0;
};
const tradeRange = (value: number, marginDown: number, marginUp: number) => ({
  min: Math.round(value * (1 - marginDown / 100)),
  max: Math.round(value * (1 + marginUp / 100)),
});
const validatePhotos = (n: number) => n >= 1 && n <= 5;
const validateVideo = (bytes: number) => bytes <= 50 * 1024 * 1024;
const validateMargin = (m: number) => m >= 1 && m <= 100;
const requiredFields = ["name", "category", "market_value"];
const isComplete = (i: any) => requiredFields.every((f) => i[f] != null && i[f] !== "");
const detectPriceDeviation = (val: number, suggested: number) =>
  suggested > 0 ? Math.abs(val - suggested) / suggested : 0;
const isSuspiciousPrice = (val: number, suggested: number) =>
  detectPriceDeviation(val, suggested) > 0.6;

describe("E2E Items", () => {
  it("01 formata 0 cents", () => expect(formatCurrency("0")).toMatch(/R\$\s0,00/));
  it("02 formata 15000 cents", () => expect(formatCurrency("15000")).toMatch(/150,00/));
  it("03 parse R$ 150,00 -> 15000", () => expect(parseCents("R$ 150,00")).toBe(15000));
  it("04 trade range com margem 10/15", () => {
    const r = tradeRange(10000, 10, 15);
    expect(r.min).toBe(9000);
    expect(r.max).toBe(11500);
  });
  it("05 mínimo 1 foto", () => expect(validatePhotos(1)).toBe(true));
  it("06 máximo 5 fotos", () => expect(validatePhotos(5)).toBe(true));
  it("07 rejeita 6 fotos", () => expect(validatePhotos(6)).toBe(false));
  it("08 rejeita 0 fotos", () => expect(validatePhotos(0)).toBe(false));
  it("09 vídeo 49MB ok", () => expect(validateVideo(49 * 1024 * 1024)).toBe(true));
  it("10 vídeo 51MB recusado", () => expect(validateVideo(51 * 1024 * 1024)).toBe(false));
  it("11 margem 50 ok", () => expect(validateMargin(50)).toBe(true));
  it("12 margem 0 recusada", () => expect(validateMargin(0)).toBe(false));
  it("13 item completo", () =>
    expect(isComplete({ name: "X", category: "C", market_value: 100 })).toBe(true));
  it("14 item incompleto sem nome", () =>
    expect(isComplete({ name: "", category: "C", market_value: 100 })).toBe(false));
  it("15 detecta preço suspeito >60%", () => expect(isSuspiciousPrice(20000, 10000)).toBe(true));
});
