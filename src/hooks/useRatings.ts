import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Rating {
  id: string;
  match_id: string;
  rater_id: string;
  rated_id: string;
  score: number;
  comment: string | null;
  created_at: string;
}

export const useUserRating = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["user-rating", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ratings")
        .select("score")
        .eq("rated_id", userId!);
      if (error) throw error;
      if (!data || data.length === 0) return null;
      const avg = data.reduce((sum, r) => sum + r.score, 0) / data.length;
      return { average: Math.round(avg * 10) / 10, count: data.length };
    },
    enabled: !!userId,
  });
};

export const useMatchRating = (matchId: string | undefined, raterId: string | undefined) => {
  return useQuery({
    queryKey: ["match-rating", matchId, raterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ratings")
        .select("*")
        .eq("match_id", matchId!)
        .eq("rater_id", raterId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!matchId && !!raterId,
  });
};

export const submitRating = async (data: {
  match_id: string;
  rater_id: string;
  rated_id: string;
  score: number;
  comment?: string;
}) => {
  const { error } = await supabase.from("ratings").insert(data);
  if (error) throw error;
};
