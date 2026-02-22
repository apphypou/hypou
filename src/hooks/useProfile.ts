import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useProfile = () => {
  const { user } = useAuth();

  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const itemsQuery = useQuery({
    queryKey: ["my-items", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("items")
        .select("*, item_images(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const statsQuery = useQuery({
    queryKey: ["profile-stats", user?.id],
    queryFn: async () => {
      // Total proposals (matches)
      const { count: totalProposals } = await supabase
        .from("matches")
        .select("*", { count: "exact", head: true })
        .or(`user_a_id.eq.${user!.id},user_b_id.eq.${user!.id}`);

      // Completed trades
      const { count: totalTrades } = await supabase
        .from("matches")
        .select("*", { count: "exact", head: true })
        .or(`user_a_id.eq.${user!.id},user_b_id.eq.${user!.id}`)
        .eq("status", "accepted");

      return {
        totalProposals: totalProposals ?? 0,
        totalTrades: totalTrades ?? 0,
        rating: 4.9, // placeholder until rating system is implemented
      };
    },
    enabled: !!user,
  });

  return {
    profile: profileQuery.data,
    items: itemsQuery.data ?? [],
    stats: statsQuery.data,
    isLoading: profileQuery.isLoading || itemsQuery.isLoading,
    refetchProfile: profileQuery.refetch,
    refetchItems: itemsQuery.refetch,
  };
};
