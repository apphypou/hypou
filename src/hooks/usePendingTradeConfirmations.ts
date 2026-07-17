import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getMatches } from "@/services/matchService";
import { getTradeConfirmationState } from "@/lib/tradeConfirmation";

export function usePendingTradeConfirmations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["pending-trade-confirmations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const matches = await getMatches(user!.id);
      return matches.filter((match) => getTradeConfirmationState(match).needsMyConfirmation);
    },
    staleTime: 15_000,
  });
}
