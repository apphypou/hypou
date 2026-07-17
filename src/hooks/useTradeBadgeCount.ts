import { useMemo } from "react";
import { useMatches } from "@/hooks/useMatches";
import { getTradeConfirmationState } from "@/lib/tradeConfirmation";

export const useTradeBadgeCount = () => {
  const { data: matches = [] } = useMatches();

  return useMemo(
    () =>
      matches.filter((match) => (
        (match.status === "proposal" && match.my_item_side === "b") ||
        getTradeConfirmationState(match).needsMyConfirmation
      )).length,
    [matches],
  );
};
