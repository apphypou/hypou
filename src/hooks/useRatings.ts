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

export interface RatingWithRater extends Rating {
  rater?: { display_name: string | null; avatar_url: string | null } | null;
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

export const useUserRatingsList = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["user-ratings-list", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ratings")
        .select("*")
        .eq("rated_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const ratings = (data || []) as Rating[];
      const raterIds = Array.from(new Set(ratings.map((r) => r.rater_id)));
      const profilesMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
      if (raterIds.length > 0) {
        const { data: profs } = await supabase
          .from("public_profiles" as any)
          .select("user_id, display_name, avatar_url")
          .in("user_id", raterIds);
        (profs as any[] | null)?.forEach((p) => {
          profilesMap[p.user_id] = { display_name: p.display_name, avatar_url: p.avatar_url };
        });
      }
      return ratings.map((r) => ({ ...r, rater: profilesMap[r.rater_id] || null })) as RatingWithRater[];
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
