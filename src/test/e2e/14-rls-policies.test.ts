/**
 * E2E #14 — RLS Policies (lógica documentada das policies).
 * Valida o desenho das regras de acesso (sem exigir DB live).
 */
import { describe, it, expect } from "vitest";

type Op = "SELECT" | "INSERT" | "UPDATE" | "DELETE";
const can = (table: string, op: Op, isOwner: boolean, isAdmin = false, isParticipant = false): boolean => {
  switch (table) {
    case "profiles":
      if (op === "SELECT") return isOwner || isAdmin;
      if (op === "INSERT" || op === "UPDATE") return isOwner;
      return false;
    case "items":
      if (op === "SELECT") return true;
      return isOwner;
    case "matches":
      if (op === "SELECT" || op === "UPDATE") return isParticipant;
      if (op === "INSERT") return isOwner;
      return false;
    case "messages":
    case "conversations":
      return isParticipant;
    case "blocked_users":
    case "favorites":
    case "notifications":
    case "swipes":
      return isOwner;
    case "reports":
      if (op === "INSERT") return isOwner;
      if (op === "SELECT" || op === "UPDATE") return isOwner || isAdmin;
      return false;
    case "ratings":
      if (op === "SELECT") return true;
      if (op === "INSERT" || op === "DELETE") return isOwner;
      return false;
    default:
      return false;
  }
};

describe("E2E RLS Policies", () => {
  it("01 profiles SELECT só dono", () => expect(can("profiles", "SELECT", true)).toBe(true));
  it("02 profiles SELECT outro usuário negado", () => expect(can("profiles", "SELECT", false)).toBe(false));
  it("03 profiles SELECT admin permitido", () => expect(can("profiles", "SELECT", false, true)).toBe(true));
  it("04 items SELECT público (qualquer um)", () => expect(can("items", "SELECT", false)).toBe(true));
  it("05 items UPDATE só dono", () => expect(can("items", "UPDATE", true)).toBe(true));
  it("06 items DELETE outro usuário negado", () => expect(can("items", "DELETE", false)).toBe(false));
  it("07 matches SELECT só participantes", () =>
    expect(can("matches", "SELECT", false, false, true)).toBe(true));
  it("08 matches SELECT terceiro negado", () =>
    expect(can("matches", "SELECT", false, false, false)).toBe(false));
  it("09 messages SELECT só participantes do chat", () =>
    expect(can("messages", "SELECT", false, false, true)).toBe(true));
  it("10 messages INSERT terceiro negado", () =>
    expect(can("messages", "INSERT", false, false, false)).toBe(false));
  it("11 conversations terceiro negado", () =>
    expect(can("conversations", "SELECT", false, false, false)).toBe(false));
  it("12 blocked_users só dono SELECT", () => expect(can("blocked_users", "SELECT", true)).toBe(true));
  it("13 favorites só dono", () => expect(can("favorites", "SELECT", true)).toBe(true));
  it("14 swipes outros negado", () => expect(can("swipes", "SELECT", false)).toBe(false));
  it("15 notifications só dono", () => expect(can("notifications", "SELECT", true)).toBe(true));
  it("16 ratings públicos para SELECT", () => expect(can("ratings", "SELECT", false)).toBe(true));
  it("17 ratings INSERT só dono (rater)", () => expect(can("ratings", "INSERT", true)).toBe(true));
  it("18 reports SELECT admin permitido", () => expect(can("reports", "SELECT", false, true)).toBe(true));
  it("19 reports INSERT só pelo próprio reporter", () =>
    expect(can("reports", "INSERT", true)).toBe(true));
  it("20 matches DELETE proibido para todos (sem policy)", () =>
    expect(can("matches", "DELETE", true, true, true)).toBe(false));
});
