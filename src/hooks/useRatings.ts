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
      const { data, error } = await supabase
        .from("ratings")
        .select("*")
        .eq("rated_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const ratings = (data || []) as Rating[];
      const raterIds = Array.from(new Set(ratings.map((r) => r.rater_id)));
      const matchIds = Array.from(new Set(ratings.map((r) => r.match_id)));
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

      // Fetch items per match for both sides
      const matchItemsMap: Record<string, { raterItem: RatingItemInfo | null; ratedItem: RatingItemInfo | null }> = {};
      if (matchIds.length > 0) {
        const { data: matchesData } = await supabase
          .from("matches")
          .select("id, user_a_id, user_b_id, item_a_id, item_b_id")
          .in("id", matchIds);

        const itemIds = Array.from(
          new Set(
            (matchesData || []).flatMap((m: any) => [m.item_a_id, m.item_b_id]).filter(Boolean),
          ),
        );
        const itemsMap: Record<string, RatingItemInfo> = {};
        if (itemIds.length > 0) {
          const { data: itemsData } = await supabase
            .from("items")
            .select("id, name, item_images (image_url, position)")
            .in("id", itemIds);
          (itemsData as any[] | null)?.forEach((it) => {
            const sorted = (it.item_images || []).slice().sort((a: any, b: any) => a.position - b.position);
            itemsMap[it.id] = { id: it.id, name: it.name, image_url: sorted[0]?.image_url || null };
          });
        }

        ratings.forEach((r) => {
          const match = (matchesData as any[] | null)?.find((m) => m.id === r.match_id);
          if (!match) return;
          const raterItemId = match.user_a_id === r.rater_id ? match.item_a_id : match.item_b_id;
          const ratedItemId = match.user_a_id === r.rated_id ? match.item_a_id : match.item_b_id;
          matchItemsMap[r.id] = {
            raterItem: itemsMap[raterItemId] || null,
            ratedItem: itemsMap[ratedItemId] || null,
          };
        });
      }

      return ratings.map((r) => ({
        ...r,
        rater: profilesMap[r.rater_id] || null,
        rater_item: matchItemsMap[r.id]?.raterItem || null,
        rated_item: matchItemsMap[r.id]?.ratedItem || null,
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
