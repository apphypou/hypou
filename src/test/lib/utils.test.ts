import { describe, it, expect } from "vitest";
import { cn, formatValue, getErrorMessage, translateCondition, CONDITION_MAP } from "@/lib/utils";

describe("utils", () => {
  it("01 cn merge classes simples", () => {
    expect(cn("a", "b")).toBe("a b");
  });
  it("02 cn dedup tailwind conflicts", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
  it("03 cn ignora false/null/undef", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });
  it("04 formatValue 12345 cents = R$ 123,45", () => {
    expect(formatValue(12345)).toMatch(/R\$\s*123,45/);
  });
  it("05 formatValue 0 cents = R$ 0,00", () => {
    expect(formatValue(0)).toMatch(/R\$\s*0,00/);
  });
  it("06 formatValue 100000 cents = R$ 1.000,00", () => {
    expect(formatValue(100000)).toMatch(/R\$\s*1\.000,00/);
  });
  it("07 translateCondition used→Usado", () => {
    expect(translateCondition("used")).toBe("Usado");
  });
  it("08 translateCondition like_new→Semi-novo", () => {
    expect(translateCondition("like_new")).toBe("Semi-novo");
  });
  it("09 translateCondition null→null", () => {
    expect(translateCondition(null)).toBeNull();
  });
  it("10 translateCondition desconhecida retorna raw", () => {
    expect(translateCondition("xyz")).toBe("xyz");
  });
  it("11 CONDITION_MAP completa", () => {
    expect(Object.keys(CONDITION_MAP).length).toBeGreaterThanOrEqual(6);
  });
  it("12 getErrorMessage preserva mensagem em português", () => {
    expect(getErrorMessage(new Error("Falha na rede"))).toBe("Falha na rede");
  });
  it("13 getErrorMessage usa fallback para valor desconhecido", () => {
    expect(getErrorMessage({ code: "unexpected" }, "Não foi possível concluir.")).toBe("Não foi possível concluir.");
  });
  it("14 traduz os erros técnicos mais comuns", () => {
    expect(getErrorMessage(new Error("Invalid login credentials"))).toBe("E-mail ou senha incorretos.");
    expect(getErrorMessage(new Error("permission denied"))).toBe("Você não tem permissão para concluir esta ação.");
    expect(getErrorMessage(new Error("Failed to fetch"))).toBe("Não foi possível conectar. Verifique sua internet e tente novamente.");
    expect(getErrorMessage(new Error("Unauthorized"))).toBe("Sua sessão expirou. Entre novamente para continuar.");
  });
  it("15 oculta erro técnico desconhecido", () => {
    expect(getErrorMessage(new Error("unhandled_database_exception"), "Não foi possível salvar.")).toBe("Não foi possível salvar.");
  });
});
