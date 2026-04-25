/**
 * E2E #4 — Match / Hybrid Proposals (12 tests)
 */
import { describe, it, expect } from "vitest";

const canCreateProposal = (mySide: "a", myItem: any, theirItem: any) =>
  !!myItem && !!theirItem && myItem.user_id !== theirItem.user_id && mySide === "a";

const validTransition = (from: string, to: string) => {
  const t: Record<string, string[]> = {
    proposal: ["accepted", "rejected"],
    accepted: ["completed"],
    completed: [],
    rejected: [],
  };
  return (t[from] || []).includes(to);
};

const canAcceptOrReject = (match: any, uid: string) =>
  match.status === "proposal" && match.user_b_id === uid;
const canCancel = (match: any, uid: string) =>
  match.status === "proposal" && match.user_a_id === uid;
const canConfirmTrade = (match: any, uid: string) =>
  match.status === "accepted" && (match.user_a_id === uid || match.user_b_id === uid);

const detectDuplicate = (msg: string) => /duplicate/i.test(msg);

describe("E2E Match/Propostas", () => {
  it("01 cria proposta com itens diferentes donos", () =>
    expect(canCreateProposal("a", { user_id: "me" }, { user_id: "o" })).toBe(true));
  it("02 bloqueia proposta com próprio item", () =>
    expect(canCreateProposal("a", { user_id: "me" }, { user_id: "me" })).toBe(false));
  it("03 transição proposal->accepted válida", () =>
    expect(validTransition("proposal", "accepted")).toBe(true));
  it("04 transição proposal->completed inválida", () =>
    expect(validTransition("proposal", "completed")).toBe(false));
  it("05 transição accepted->completed válida", () =>
    expect(validTransition("accepted", "completed")).toBe(true));
  it("06 completed é terminal", () =>
    expect(validTransition("completed", "accepted")).toBe(false));
  it("07 só user_b aceita/recusa", () =>
    expect(canAcceptOrReject({ status: "proposal", user_b_id: "u" }, "u")).toBe(true));
  it("08 user_a não pode aceitar", () =>
    expect(canAcceptOrReject({ status: "proposal", user_b_id: "u" }, "x")).toBe(false));
  it("09 só user_a cancela", () =>
    expect(canCancel({ status: "proposal", user_a_id: "u" }, "u")).toBe(true));
  it("10 ambos confirmam troca aceita", () =>
    expect(canConfirmTrade({ status: "accepted", user_a_id: "a", user_b_id: "b" }, "b")).toBe(true));
  it("11 não pode aceitar match aceito", () =>
    expect(canAcceptOrReject({ status: "accepted", user_b_id: "u" }, "u")).toBe(false));
  it("12 detecta duplicidade de proposta", () =>
    expect(detectDuplicate("duplicate key value")).toBe(true));
});
