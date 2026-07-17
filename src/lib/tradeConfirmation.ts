import type { MatchWithDetails } from "@/services/matchService";

type ConfirmableMatch = Pick<
  MatchWithDetails,
  "status" | "my_item_side" | "confirmed_by_a" | "confirmed_by_b"
>;

export function getTradeConfirmationState(match: ConfirmableMatch) {
  const isUserA = match.my_item_side === "a";
  const myConfirmed = isUserA ? !!match.confirmed_by_a : !!match.confirmed_by_b;
  const otherConfirmed = isUserA ? !!match.confirmed_by_b : !!match.confirmed_by_a;

  return {
    myConfirmed,
    otherConfirmed,
    needsMyConfirmation: match.status === "accepted" && otherConfirmed && !myConfirmed,
  };
}
