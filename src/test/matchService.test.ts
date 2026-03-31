import { describe, it, expect } from "vitest";

// Test proposal validation logic
describe("Proposal validation", () => {
  it("should reject if current user is not user_b", () => {
    const match = { user_b_id: "user-b", status: "proposal" };
    const currentUserId = "user-a";
    const canAccept = match.user_b_id === currentUserId && match.status === "proposal";
    expect(canAccept).toBe(false);
  });

  it("should allow user_b to accept proposal", () => {
    const match = { user_b_id: "user-b", status: "proposal" };
    const currentUserId = "user-b";
    const canAccept = match.user_b_id === currentUserId && match.status === "proposal";
    expect(canAccept).toBe(true);
  });

  it("should reject if status is not proposal", () => {
    const match = { user_b_id: "user-b", status: "accepted" };
    const currentUserId = "user-b";
    const canAccept = match.user_b_id === currentUserId && match.status === "proposal";
    expect(canAccept).toBe(false);
  });
});

// Test trade confirmation logic
describe("Trade confirmation", () => {
  const checkCompletion = (confirmedA: boolean, confirmedB: boolean, status: string) => {
    if (confirmedA && confirmedB && status === "accepted") return "completed";
    return status;
  };

  it("should complete when both parties confirm", () => {
    expect(checkCompletion(true, true, "accepted")).toBe("completed");
  });

  it("should not complete when only one party confirms", () => {
    expect(checkCompletion(true, false, "accepted")).toBe("accepted");
    expect(checkCompletion(false, true, "accepted")).toBe("accepted");
  });

  it("should not complete if status is not accepted", () => {
    expect(checkCompletion(true, true, "proposal")).toBe("proposal");
  });
});

// Test badge logic
describe("Match badge logic", () => {
  type Badge = { label: string; color: string } | null;

  const getBadge = (status: string, mySide: "a" | "b", createdAt: string): Badge => {
    if (status === "completed") return { label: "Concluída", color: "completed" };
    if (status === "accepted") return { label: "Aceita", color: "accepted" };
    if (status === "proposal" && mySide === "a") return { label: "Enviada", color: "sent" };
    const age = Date.now() - new Date(createdAt).getTime();
    if (age < 24 * 60 * 60 * 1000) return { label: "Nova Proposta", color: "new" };
    return { label: "Pendente", color: "pending" };
  };

  it("should show Concluída for completed", () => {
    expect(getBadge("completed", "a", "2024-01-01")?.label).toBe("Concluída");
  });

  it("should show Aceita for accepted", () => {
    expect(getBadge("accepted", "a", "2024-01-01")?.label).toBe("Aceita");
  });

  it("should show Enviada for sent proposals", () => {
    expect(getBadge("proposal", "a", "2024-01-01")?.label).toBe("Enviada");
  });

  it("should show Nova Proposta for recent proposals to user_b", () => {
    expect(getBadge("proposal", "b", new Date().toISOString())?.label).toBe("Nova Proposta");
  });

  it("should show Pendente for old proposals to user_b", () => {
    expect(getBadge("proposal", "b", "2020-01-01")?.label).toBe("Pendente");
  });
});
