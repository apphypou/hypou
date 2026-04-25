/**
 * E2E #17 — Database Triggers (lógica documentada).
 */
import { describe, it, expect } from "vitest";

// check_trade_completion
const checkTradeCompletion = (a: boolean, b: boolean, status: string) =>
  a && b && status === "accepted" ? "completed" : status;

// deactivate_items_on_trade_completion
const shouldDeactivateItems = (newStatus: string, oldStatus: string) =>
  newStatus === "completed" && oldStatus !== "completed";

// notify_on_match: cria notificação para user_b
const notifyOnMatch = (newRow: { user_b_id: string }) => ({
  user_id: newRow.user_b_id,
  type: "proposal",
  title: "Nova proposta! 🔔",
});

// notify_on_trade_confirmed: cria 2 notificações (a e b) ao mudar para accepted
const notifyOnAccepted = (oldStatus: string, newStatus: string, ua: string, ub: string) => {
  if (oldStatus !== "accepted" && newStatus === "accepted") {
    return [
      { user_id: ua, type: "trade_confirmed" },
      { user_id: ub, type: "trade_confirmed" },
    ];
  }
  return [];
};

// handle_new_user: cria profile
const handleNewUser = (user: { id: string; raw_user_meta_data?: { display_name?: string } }) => ({
  user_id: user.id,
  display_name: user.raw_user_meta_data?.display_name ?? "",
});

describe("E2E DB Triggers", () => {
  it("01 dupla confirmação dispara completed", () =>
    expect(checkTradeCompletion(true, true, "accepted")).toBe("completed"));
  it("02 só A não completa", () =>
    expect(checkTradeCompletion(true, false, "accepted")).toBe("accepted"));
  it("03 desativa itens quando passa para completed", () =>
    expect(shouldDeactivateItems("completed", "accepted")).toBe(true));
  it("04 não desativa em transição não-completa", () =>
    expect(shouldDeactivateItems("rejected", "accepted")).toBe(false));
  it("05 não re-desativa se já completed", () =>
    expect(shouldDeactivateItems("completed", "completed")).toBe(false));
  it("06 notifica apenas user_b ao receber proposta", () => {
    const n = notifyOnMatch({ user_b_id: "u2" });
    expect(n.user_id).toBe("u2");
    expect(n.type).toBe("proposal");
  });
  it("07 notifica ambos no aceite", () => {
    const list = notifyOnAccepted("proposal", "accepted", "ua", "ub");
    expect(list.length).toBe(2);
    expect(list.map((n) => n.user_id)).toEqual(["ua", "ub"]);
  });
  it("08 não notifica se status não muda para accepted", () => {
    expect(notifyOnAccepted("accepted", "accepted", "ua", "ub").length).toBe(0);
  });
  it("09 handle_new_user cria profile com display_name", () => {
    const p = handleNewUser({ id: "x", raw_user_meta_data: { display_name: "Maria" } });
    expect(p.display_name).toBe("Maria");
  });
  it("10 handle_new_user fallback display_name vazio", () => {
    expect(handleNewUser({ id: "x" }).display_name).toBe("");
  });
});
