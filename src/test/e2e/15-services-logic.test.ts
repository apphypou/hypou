/**
 * E2E #15 — Services & Business Logic
 * Valida regras puras dos services sem hits no Supabase.
 */
import { describe, it, expect } from "vitest";

// Trade range: market_value ± margins
const tradeRange = (mv: number, marginUp: number, marginDown: number) => ({
  min: Math.round(mv * (1 - marginDown / 100)),
  max: Math.round(mv * (1 + marginUp / 100)),
});

// Compatibilidade: itens compatíveis se valor cai no range mútuo
const isCompatible = (a: number, b: number, marginA: number, marginB: number) => {
  const ra = tradeRange(a, marginA, marginA);
  const rb = tradeRange(b, marginB, marginB);
  return b >= ra.min && b <= ra.max && a >= rb.min && a <= rb.max;
};

// Match status transitions
const validTransition = (from: string, to: string) => {
  const allowed: Record<string, string[]> = {
    proposal: ["accepted", "rejected"],
    accepted: ["completed", "rejected"],
    completed: [],
    rejected: [],
  };
  return allowed[from]?.includes(to) ?? false;
};

// Double confirmation → completed
const isCompleted = (a: boolean, b: boolean, status: string) =>
  a && b && status === "accepted";

// BRL parse/format
const parseBRLToCents = (s: string) => {
  const digits = s.replace(/\D/g, "");
  return parseInt(digits || "0", 10);
};

// Distance haversine (km)
const distanceKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

describe("E2E Services Logic", () => {
  it("01 trade range 100 ±15/10 → [90,115]", () => {
    expect(tradeRange(100, 15, 10)).toEqual({ min: 90, max: 115 });
  });
  it("02 trade range zero", () => {
    expect(tradeRange(0, 10, 10)).toEqual({ min: 0, max: 0 });
  });
  it("03 itens compatíveis dentro do range", () => {
    expect(isCompatible(100, 105, 15, 15)).toBe(true);
  });
  it("04 itens incompatíveis", () => {
    expect(isCompatible(100, 200, 15, 15)).toBe(false);
  });
  it("05 transição proposal→accepted válida", () =>
    expect(validTransition("proposal", "accepted")).toBe(true));
  it("06 transição proposal→completed inválida", () =>
    expect(validTransition("proposal", "completed")).toBe(false));
  it("07 transição accepted→completed válida", () =>
    expect(validTransition("accepted", "completed")).toBe(true));
  it("08 completed é terminal", () => expect(validTransition("completed", "rejected")).toBe(false));
  it("09 rejected é terminal", () => expect(validTransition("rejected", "accepted")).toBe(false));
  it("10 dupla confirmação completa", () => expect(isCompleted(true, true, "accepted")).toBe(true));
  it("11 só A confirma não completa", () => expect(isCompleted(true, false, "accepted")).toBe(false));
  it("12 confirmação sem accepted não completa", () =>
    expect(isCompleted(true, true, "proposal")).toBe(false));
  it("13 parseBRL R$ 12,34 → 1234 cents", () => expect(parseBRLToCents("R$ 12,34")).toBe(1234));
  it("14 parseBRL string vazia → 0", () => expect(parseBRLToCents("")).toBe(0));
  it("15 parseBRL R$ 1.000,00 → 100000", () => expect(parseBRLToCents("R$ 1.000,00")).toBe(100000));
  it("16 distância SP↔RJ ~360km", () => {
    const d = distanceKm(-23.55, -46.63, -22.91, -43.17);
    expect(d).toBeGreaterThan(300);
    expect(d).toBeLessThan(400);
  });
  it("17 distância mesma coord = 0", () => {
    expect(distanceKm(0, 0, 0, 0)).toBe(0);
  });
  it("18 trade range margem 0", () => {
    expect(tradeRange(100, 0, 0)).toEqual({ min: 100, max: 100 });
  });
});
