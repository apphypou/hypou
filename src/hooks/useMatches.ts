import { useQuery } from "@tanstack/react-query";
import { getMatches, getMatch } from "@/services/matchService";
import { useAuth } from "@/hooks/useAuth";

export const useMatches = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["matches", user?.id],
    queryFn: () => getMatches(user!.id),
    enabled: !!user,
  });
};

export const useMatch = (matchId: string | null) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["match", matchId],
    queryFn: () => getMatch(matchId!, user!.id),
    enabled: !!user && !!matchId,
  });
};
