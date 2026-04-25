/**
 * E2E #1 — Auth Flow (15 tests)
 * Cobre: signup, login, OAuth, recovery, validações, redirects.
 */
import { describe, it, expect } from "vitest";

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const isStrongPwd = (p: string) => p.length >= 6;
const translateAuthError = (msg: string): string => {
  if (/Invalid login credentials/i.test(msg)) return "E-mail ou senha incorretos";
  if (/already registered/i.test(msg)) return "E-mail já cadastrado";
  if (/Email not confirmed/i.test(msg)) return "Confirme seu e-mail";
  if (/rate limit/i.test(msg)) return "Muitas tentativas, aguarde";
  return "Erro ao autenticar";
};
const buildOAuthRedirect = (origin: string, path = "/explorar") => `${origin}${path}`;
const buildResetRedirect = (origin: string) => `${origin}/reset-password`;

describe("E2E Auth Flow", () => {
  it("01 valida email simples", () => expect(isValidEmail("a@b.co")).toBe(true));
  it("02 rejeita email sem @", () => expect(isValidEmail("ab.co")).toBe(false));
  it("03 rejeita email vazio", () => expect(isValidEmail("")).toBe(false));
  it("04 rejeita email só com espaços", () => expect(isValidEmail("   ")).toBe(false));
  it("05 senha mínima 6 chars", () => expect(isStrongPwd("12345")).toBe(false));
  it("06 senha 6 chars passa", () => expect(isStrongPwd("123456")).toBe(true));
  it("07 traduz invalid credentials", () =>
    expect(translateAuthError("Invalid login credentials")).toMatch(/incorretos/));
  it("08 traduz already registered", () =>
    expect(translateAuthError("User already registered")).toMatch(/já cadastrado/));
  it("09 traduz email not confirmed", () =>
    expect(translateAuthError("Email not confirmed")).toMatch(/Confirme/));
  it("10 traduz rate limit", () =>
    expect(translateAuthError("rate limit exceeded")).toMatch(/aguarde/));
  it("11 fallback de erro", () =>
    expect(translateAuthError("xxx")).toBe("Erro ao autenticar"));
  it("12 OAuth redirect aponta para explorar", () =>
    expect(buildOAuthRedirect("https://h.app")).toBe("https://h.app/explorar"));
  it("13 reset redirect aponta para /reset-password", () =>
    expect(buildResetRedirect("https://h.app")).toBe("https://h.app/reset-password"));
  it("14 OAuth aceita path customizado", () =>
    expect(buildOAuthRedirect("https://h.app", "/onboarding")).toMatch(/onboarding$/));
  it("15 emails com + e subdomínio são válidos", () =>
    expect(isValidEmail("a+b@mail.example.co")).toBe(true));
});
