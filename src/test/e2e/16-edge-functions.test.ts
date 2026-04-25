/**
 * E2E #16 — Edge Functions (validações de contrato).
 * Garante shape de input/output esperado.
 */
import { describe, it, expect } from "vitest";

interface ValidatePriceInput { name: string; category: string; condition: string; value_cents: number; description?: string }
interface ValidatePriceOutput { valid: boolean; reason: string; suggested_min: number; suggested_max: number }

const isValidatePriceInput = (x: any): x is ValidatePriceInput =>
  typeof x?.name === "string" &&
  typeof x?.category === "string" &&
  typeof x?.condition === "string" &&
  typeof x?.value_cents === "number" &&
  x.value_cents >= 0;

const isValidatePriceOutput = (x: any): x is ValidatePriceOutput =>
  typeof x?.valid === "boolean" &&
  typeof x?.reason === "string" &&
  typeof x?.suggested_min === "number" &&
  typeof x?.suggested_max === "number" &&
  x.suggested_min <= x.suggested_max;

// 60% deviation rule
const exceedsDeviation = (price: number, suggested: number, threshold = 0.6) =>
  Math.abs(price - suggested) / suggested > threshold;

// delete-account: requires auth header
const isAuthorizedDelete = (headers: Record<string, string>) =>
  typeof headers.Authorization === "string" && headers.Authorization.startsWith("Bearer ");

// admin-stats: shape
interface AdminStats { users: number; items: number; matches: number; messages: number }
const isAdminStats = (x: any): x is AdminStats =>
  ["users", "items", "matches", "messages"].every((k) => typeof x?.[k] === "number");

describe("E2E Edge Functions", () => {
  it("01 validate-price input válido", () =>
    expect(isValidatePriceInput({ name: "Bike", category: "Esportes", condition: "used", value_cents: 50000 })).toBe(true));
  it("02 validate-price input rejeitado quando faltando campo", () =>
    expect(isValidatePriceInput({ name: "x" })).toBe(false));
  it("03 validate-price input value_cents negativo rejeitado", () =>
    expect(isValidatePriceInput({ name: "x", category: "y", condition: "used", value_cents: -1 })).toBe(false));
  it("04 validate-price output válido", () =>
    expect(isValidatePriceOutput({ valid: true, reason: "ok", suggested_min: 100, suggested_max: 200 })).toBe(true));
  it("05 validate-price output min>max rejeitado", () =>
    expect(isValidatePriceOutput({ valid: true, reason: "x", suggested_min: 200, suggested_max: 100 })).toBe(false));
  it("06 desvio 70% acima do limite", () => expect(exceedsDeviation(170, 100)).toBe(true));
  it("07 desvio 50% dentro do limite", () => expect(exceedsDeviation(150, 100)).toBe(false));
  it("08 desvio 60% borda (não excede)", () => expect(exceedsDeviation(160, 100)).toBe(false));
  it("09 delete-account exige Bearer", () =>
    expect(isAuthorizedDelete({ Authorization: "Bearer abc" })).toBe(true));
  it("10 delete-account sem token rejeita", () => expect(isAuthorizedDelete({})).toBe(false));
  it("11 delete-account header inválido rejeita", () =>
    expect(isAuthorizedDelete({ Authorization: "abc" })).toBe(false));
  it("12 admin-stats shape válido", () =>
    expect(isAdminStats({ users: 1, items: 2, matches: 3, messages: 4 })).toBe(true));
  it("13 admin-stats shape parcial inválido", () =>
    expect(isAdminStats({ users: 1 })).toBe(false));
});
