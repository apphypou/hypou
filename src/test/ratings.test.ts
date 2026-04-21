import { describe, it, expect } from "vitest";

const isValidScore = (s: number) => Number.isInteger(s) && s >= 1 && s <= 5;

const canRate = (
  match: { user_a_id: string; user_b_id: string; status: string },
  rater: string,
) =>
  match.status === "completed" &&
  (match.user_a_id === rater || match.user_b_id === rater);

const averageRating = (scores: number[]) =>
  scores.length === 0 ? 0 : scores.reduce((a, b) => a + b, 0) / scores.length;

describe("Ratings: score validation", () => {
  it("accepts 1..5", () => {
    expect(isValidScore(1)).toBe(true);
    expect(isValidScore(5)).toBe(true);
  });
  it("rejects 0 and 6", () => {
    expect(isValidScore(0)).toBe(false);
    expect(isValidScore(6)).toBe(false);
  });
  it("rejects negative", () => expect(isValidScore(-1)).toBe(false));
});

describe("Ratings: permissions", () => {
  it("participant can rate completed", () => {
    expect(canRate({ user_a_id: "A", user_b_id: "B", status: "completed" }, "A")).toBe(true);
  });
  it("non-participant cannot", () => {
    expect(canRate({ user_a_id: "A", user_b_id: "B", status: "completed" }, "C")).toBe(false);
  });
  it("only after completed", () => {
    expect(canRate({ user_a_id: "A", user_b_id: "B", status: "accepted" }, "A")).toBe(false);
  });
});

describe("Ratings: average", () => {
  it("computes mean", () => expect(averageRating([5, 4, 3])).toBe(4));
  it("returns 0 for empty", () => expect(averageRating([])).toBe(0));
});
