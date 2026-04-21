import { describe, it, expect } from "vitest";

type Status = "proposal" | "accepted" | "rejected" | "completed";
const VALID: Record<Status, Status[]> = {
  proposal: ["accepted", "rejected"],
  accepted: ["completed"],
  rejected: [],
  completed: [],
};

const canAccept = (m: { user_b_id: string; status: Status }, currentUser: string) =>
  m.user_b_id === currentUser && m.status === "proposal";

const canCancel = (m: { user_a_id: string; status: Status }, currentUser: string) =>
  m.user_a_id === currentUser && m.status === "proposal";

const isValidTransition = (from: Status, to: Status) => VALID[from].includes(to);

const getBadgeRole = (m: { user_a_id: string; user_b_id: string }, currentUser: string) =>
  m.user_a_id === currentUser ? "Enviada" : m.user_b_id === currentUser ? "Recebida" : null;

const conversationCreated = (status: Status) => status === "accepted";

describe("Proposals: permissions", () => {
  it("only user_b accepts", () => {
    expect(canAccept({ user_b_id: "B", status: "proposal" }, "B")).toBe(true);
    expect(canAccept({ user_b_id: "B", status: "proposal" }, "A")).toBe(false);
  });
  it("only user_a cancels", () => {
    expect(canCancel({ user_a_id: "A", status: "proposal" }, "A")).toBe(true);
    expect(canCancel({ user_a_id: "A", status: "proposal" }, "B")).toBe(false);
  });
  it("cannot accept non-proposal", () => {
    expect(canAccept({ user_b_id: "B", status: "accepted" }, "B")).toBe(false);
  });
});

describe("Proposals: state machine", () => {
  it("proposal -> accepted ok", () => expect(isValidTransition("proposal", "accepted")).toBe(true));
  it("proposal -> rejected ok", () => expect(isValidTransition("proposal", "rejected")).toBe(true));
  it("completed -> accepted blocked", () => expect(isValidTransition("completed", "accepted")).toBe(false));
});

describe("Proposals: badges and chat", () => {
  it("badge Enviada for user_a", () => {
    expect(getBadgeRole({ user_a_id: "A", user_b_id: "B" }, "A")).toBe("Enviada");
  });
  it("conversation only after accepted", () => {
    expect(conversationCreated("accepted")).toBe(true);
    expect(conversationCreated("proposal")).toBe(false);
  });
});
