import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminStats {
  meta: { periodDays: number; updatedAt: string };
  kpis: {
    totalUsers: number;
    activeItems: number;
    totalMatches: number;
    totalMessages: number;
    swipesToday: number;
    pendingReports: number;
    waitlistCount: number;
    activationRate: number;
    completionRate: number;
    averageRating: number | null;
  };
  validation: {
    acquisition: { signups: number; attributedUsers: number; sourceConfigured: boolean; cpaCents: number | null };
    activation: { firstItem: number; firstSearch: number; firstTrade: number; activated: number };
    engagement: { wau: number; mau: number; active90d: number; interactions: number };
    liquidity: { itemsPublished: number; tradesOpen: number; tradesProgressed: number; completedTrades: number; progressRate: number };
    retention: { d7: number | null; d30: number | null; d90: number | null; configured: boolean };
    satisfaction: { averageRating: number | null; ratingsCount: number; nps: number | null; npsResponses: number };
    monetization: { configured: boolean; paidUsers: number; arpuCents: number | null; mrrCents: number | null; ltvCents: number | null };
  };
  charts: {
    usersByDay: { date: string; count: number }[];
    matchesByDay: { date: string; count: number }[];
    itemsByCategory: { name: string; value: number }[];
    waitlistByDay: { date: string; count: number }[];
    liquidityByCity: { name: string; value: number }[];
    acquisitionSources: { name: string; value: number }[];
  };
  activity: { name: string; occurredAt: string; platform: string | null }[];
}

export function useAdminStats(periodDays = 30) {
  return useQuery<AdminStats>({
    queryKey: ["admin-stats", periodDays],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("admin-stats", {
        body: { periodDays },
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
