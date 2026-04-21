import { describe, it, expect } from "vitest";

const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidPassword = (pw: string): boolean => pw.length >= 6;

const translateAuthError = (msg: string): string => {
  if (msg.includes("Invalid login credentials")) return "E-mail ou senha incorretos";
  if (msg.includes("Email not confirmed")) return "E-mail não confirmado";
  if (msg.includes("User already registered")) return "Usuário já cadastrado";
  return "Erro ao autenticar";
};

const buildRedirectUrl = (origin: string, path = "/explorar") => `${origin}${path}`;

describe("Auth: email validation", () => {
  it("accepts valid email", () => {
    expect(isValidEmail("user@hypou.com")).toBe(true);
  });
  it("rejects email without @", () => {
    expect(isValidEmail("userhypou.com")).toBe(false);
  });
  it("rejects email without domain", () => {
    expect(isValidEmail("user@")).toBe(false);
  });
});

describe("Auth: password rules", () => {
  it("rejects password shorter than 6", () => {
    expect(isValidPassword("12345")).toBe(false);
  });
  it("accepts 6+ char password", () => {
    expect(isValidPassword("123456")).toBe(true);
  });
});

describe("Auth: error translation pt-BR", () => {
  it("translates invalid credentials", () => {
    expect(translateAuthError("Invalid login credentials")).toBe("E-mail ou senha incorretos");
  });
  it("translates email not confirmed", () => {
    expect(translateAuthError("Email not confirmed")).toBe("E-mail não confirmado");
  });
});

describe("Auth: OAuth redirect URL", () => {
  it("includes origin", () => {
    expect(buildRedirectUrl("https://hypou.lovable.app")).toBe("https://hypou.lovable.app/explorar");
  });
});
