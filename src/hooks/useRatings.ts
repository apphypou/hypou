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

export interface RatingItemInfo {
  id: string;
  name: string;
  image_url: string | null;
}

export interface RatingWithRater extends Rating {
  rater?: { display_name: string | null; avatar_url: string | null } | null;
  rater_item?: RatingItemInfo | null;
  rated_item?: RatingItemInfo | null;
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
      const { data, error } = await supabase.rpc("get_user_ratings_with_items" as any, {
        _user_id: userId!,
      });
      if (error) throw error;
      return ((data as any[]) || []).map((r) => ({
        id: r.id,
        match_id: r.match_id,
        rater_id: r.rater_id,
        rated_id: r.rated_id,
        score: r.score,
        comment: r.comment,
        created_at: r.created_at,
        rater: { display_name: r.rater_display_name, avatar_url: r.rater_avatar_url },
        rater_item: r.rater_item_id
          ? { id: r.rater_item_id, name: r.rater_item_name, image_url: r.rater_item_image }
          : null,
        rated_item: r.rated_item_id
          ? { id: r.rated_item_id, name: r.rated_item_name, image_url: r.rated_item_image }
          : null,
      })) as RatingWithRater[];
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
