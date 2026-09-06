import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeInvalidate } from "@/hooks/useRealtimeInvalidate";
import { supabase } from "@/integrations/supabase/client";
import { getTradeConfirmationState } from "@/lib/tradeConfirmation";

export const useTradeBadgeCount = () => {
  const { user } = useAuth();
  useRealtimeInvalidate(
    [{ table: "matches", invalidateKeys: [["trade-badge", user?.id]] }],
    !!user,
  );

  const { data = 0 } = useQuery({
    queryKey: ["trade-badge", user?.id],
    queryFn: async () => {
      const { data: matches, error } = await supabase
        .from("matches")
        .select("status,user_a_id,user_b_id,confirmed_by_a,confirmed_by_b")
        .or(`user_a_id.eq.${user!.id},user_b_id.eq.${user!.id}`)
        .in("status", ["proposal", "accepted"]);
      if (error) throw error;
      return (matches || []).filter((match) => {
        const shaped = {
          ...match,
          my_item_side: match.user_a_id === user!.id ? "a" as const : "b" as const,
        };
        return (
          (shaped.status === "proposal" && shaped.my_item_side === "b") ||
          getTradeConfirmationState(shaped).needsMyConfirmation
        );
      }).length;
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  return data;
};
