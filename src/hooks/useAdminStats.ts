import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminStats {
  kpis: {
    totalUsers: number;
    activeItems: number;
    totalMatches: number;
    matchesToday: number;
    totalMessages: number;
    swipesToday: number;
    pendingReports: number;
    waitlistCount: number;
    acceptanceRate: number;
  };
  charts: {
    usersByDay: { date: string; count: number }[];
    matchesByDay: { date: string; count: number }[];
    itemsByCategory: { name: string; value: number }[];
    waitlistByDay: { date: string; count: number }[];
  };
}

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("admin-stats", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      return data as AdminStats;
    },
    refetchInterval: 30000, // Poll every 30s
  });
}
