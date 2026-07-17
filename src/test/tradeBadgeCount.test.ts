import { describe, expect, it } from "vitest";

type Match = {
  status: string;
  my_item_side: "a" | "b";
  confirmed_by_a?: boolean;
  confirmed_by_b?: boolean;
};

const needsTradeBadge = (match: Match) => {
  if (match.status === "proposal" && match.my_item_side === "b") return true;
  if (match.status !== "accepted") return false;
  return match.my_item_side === "a"
    ? !!match.confirmed_by_b && !match.confirmed_by_a
    : !!match.confirmed_by_a && !match.confirmed_by_b;
};

describe("trade badge count", () => {
  it("counts received proposals and pending confirmations", () => {
    const matches: Match[] = [
      { status: "proposal", my_item_side: "b" },
      { status: "proposal", my_item_side: "a" },
      { status: "accepted", my_item_side: "a", confirmed_by_b: true, confirmed_by_a: false },
    ];

    expect(matches.filter(needsTradeBadge)).toHaveLength(2);
  });
});
