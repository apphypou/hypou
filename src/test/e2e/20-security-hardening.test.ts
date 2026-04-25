/**
 * E2E #20 — Security hardening (XSS, sanitização, validação de input).
 */
import { describe, it, expect } from "vitest";

const sanitize = (s: string) =>
  s.replace(/<script[^>]*>.*?<\/script>/gi, "").replace(/<\/?[^>]+>/g, "").trim();

const containsSqlInjection = (s: string) =>
  /(';|--|;\s*drop|union\s+select|or\s+1=1)/i.test(s);

const isStrongPassword = (p: string) =>
  p.length >= 8 && /[a-z]/.test(p) && /[0-9]/.test(p);

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

const maskPII = (s: string) =>
  s
    .replace(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, "***.***.***-**") // CPF
    .replace(/\b\d{16}\b/g, "**** **** **** ****"); // cartão

const isSafeRedirect = (url: string) => {
  try {
    const u = new URL(url, "https://hypou.lovable.app");
    return u.origin === "https://hypou.lovable.app";
  } catch {
    return false;
  }
};

const isAllowedFileExt = (name: string) =>
  /\.(jpg|jpeg|png|webp|mp4|webm|mp3|ogg)$/i.test(name);

describe("E2E Security Hardening", () => {
  it("01 sanitize remove <script>", () =>
    expect(sanitize("<script>alert(1)</script>oi")).toBe("oi"));
  it("02 sanitize remove tags HTML", () =>
    expect(sanitize("<b>oi</b>")).toBe("oi"));
  it("03 sanitize preserva texto puro", () =>
    expect(sanitize("Olá mundo")).toBe("Olá mundo"));
  it("04 detecta '; DROP TABLE'", () =>
    expect(containsSqlInjection("'; DROP TABLE users;")).toBe(true));
  it("05 detecta UNION SELECT", () =>
    expect(containsSqlInjection("1 UNION SELECT * FROM users")).toBe(true));
  it("06 detecta OR 1=1", () => expect(containsSqlInjection("admin OR 1=1")).toBe(true));
  it("07 input limpo passa", () => expect(containsSqlInjection("Bike Caloi")).toBe(false));
  it("08 senha forte aceita", () => expect(isStrongPassword("senha123")).toBe(true));
  it("09 senha curta rejeita", () => expect(isStrongPassword("ab1")).toBe(false));
  it("10 senha sem número rejeita", () => expect(isStrongPassword("abcdefgh")).toBe(false));
  it("11 email válido", () => expect(isValidEmail("a@b.com")).toBe(true));
  it("12 email inválido sem @", () => expect(isValidEmail("ab.com")).toBe(false));
  it("13 mascara CPF", () =>
    expect(maskPII("CPF: 123.456.789-00")).toContain("***.***.***-**"));
  it("14 mascara cartão", () =>
    expect(maskPII("cartao 1234567812345678")).toContain("**** **** **** ****"));
  it("15 redirect mesma origem permitido", () =>
    expect(isSafeRedirect("https://hypou.lovable.app/explorar")).toBe(true));
  it("16 redirect externo rejeitado", () =>
    expect(isSafeRedirect("https://evil.com/x")).toBe(false));
  it("17 redirect path relativo OK", () =>
    expect(isSafeRedirect("/perfil")).toBe(true));
  it("18 arquivo .exe rejeitado", () => expect(isAllowedFileExt("virus.exe")).toBe(false));
  it("19 arquivo .jpg aceito", () => expect(isAllowedFileExt("foto.jpg")).toBe(true));
  it("20 arquivo .mp4 aceito", () => expect(isAllowedFileExt("video.mp4")).toBe(true));
});
