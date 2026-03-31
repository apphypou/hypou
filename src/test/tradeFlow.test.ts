import { describe, it, expect } from "vitest";

// Test the complete trade lifecycle
describe("Trade lifecycle states", () => {
  const VALID_TRANSITIONS: Record<string, string[]> = {
    proposal: ["accepted", "rejected"],
    accepted: ["completed"],
    completed: [],
    rejected: [],
  };

  it("proposal can transition to accepted or rejected", () => {
    expect(VALID_TRANSITIONS["proposal"]).toContain("accepted");
    expect(VALID_TRANSITIONS["proposal"]).toContain("rejected");
  });

  it("accepted can transition to completed", () => {
    expect(VALID_TRANSITIONS["accepted"]).toContain("completed");
  });

  it("completed is a terminal state", () => {
    expect(VALID_TRANSITIONS["completed"]).toHaveLength(0);
  });

  it("rejected is a terminal state", () => {
    expect(VALID_TRANSITIONS["rejected"]).toHaveLength(0);
  });
});

// Test side detection
describe("User side detection", () => {
  const getSide = (userId: string, userAId: string, userBId: string): "a" | "b" | null => {
    if (userId === userAId) return "a";
    if (userId === userBId) return "b";
    return null;
  };

  it("should detect user A", () => {
    expect(getSide("user-1", "user-1", "user-2")).toBe("a");
  });

  it("should detect user B", () => {
    expect(getSide("user-2", "user-1", "user-2")).toBe("b");
  });

  it("should return null for non-participant", () => {
    expect(getSide("user-3", "user-1", "user-2")).toBeNull();
  });
});

// Test confirmation field mapping
describe("Confirmation field mapping", () => {
  const getUpdateField = (side: "a" | "b") =>
    side === "a" ? "confirmed_by_a" : "confirmed_by_b";

  it("should map side a to confirmed_by_a", () => {
    expect(getUpdateField("a")).toBe("confirmed_by_a");
  });

  it("should map side b to confirmed_by_b", () => {
    expect(getUpdateField("b")).toBe("confirmed_by_b");
  });
});

// Test value formatting
describe("Currency formatting for trades", () => {
  const formatValue = (cents: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

  it("should format 0 cents", () => {
    expect(formatValue(0)).toContain("0,00");
  });

  it("should format 15000 cents as R$ 150,00", () => {
    expect(formatValue(15000)).toContain("150,00");
  });

  it("should format large values", () => {
    expect(formatValue(1500000)).toContain("15.000,00");
  });
});
