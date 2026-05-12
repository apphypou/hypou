import { useQuery } from "@tanstack/react-query";
import { getMatches, getMatch } from "@/services/matchService";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeInvalidate } from "@/hooks/useRealtimeInvalidate";

export const useMatches = () => {
  const { user } = useAuth();

  // Realtime: any change on matches/match_items where user is involved
  useRealtimeInvalidate(
    [
      { table: "matches", invalidateKeys: [["matches", user?.id]] },
      { table: "match_items", invalidateKeys: [["matches", user?.id]] },
    ],
    !!user
  );

  return useQuery({
    queryKey: ["matches", user?.id],
    queryFn: () => getMatches(user!.id),
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnReconnect: true,
  });
};

export const useMatch = (matchId: string | null) => {
  const { user } = useAuth();

  useRealtimeInvalidate(
    matchId
      ? [
          { table: "matches", filter: `id=eq.${matchId}`, invalidateKeys: [["match", matchId]] },
          { table: "match_items", invalidateKeys: [["match", matchId]] },
        ]
      : [],
    !!user && !!matchId
  );

  return useQuery({
    queryKey: ["match", matchId],
    queryFn: () => getMatch(matchId!, user!.id),
    enabled: !!user && !!matchId,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnReconnect: true,
  });
};
