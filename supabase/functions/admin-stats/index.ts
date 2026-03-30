import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Verify user and check admin role
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claimsData, error: claimsError } =
      await supabaseAuth.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const userId = claimsData.claims.sub;

    // Use service role to check admin + fetch stats
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    // Fetch all stats in parallel
    const now = new Date();
    const thirtyDaysAgo = new Date(
      now.getTime() - 30 * 24 * 60 * 60 * 1000
    ).toISOString();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const [
      profilesRes,
      itemsRes,
      matchesRes,
      matchesTodayRes,
      messagesRes,
      swipesRes,
      reportsRes,
      waitlistRes,
      // Time series
      profilesByDayRes,
      matchesByDayRes,
      itemsByCategoryRes,
      waitlistByDayRes,
    ] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("items").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("matches").select("id", { count: "exact", head: true }),
      supabase.from("matches").select("id", { count: "exact", head: true }).gte("created_at", todayStart),
      supabase.from("messages").select("id", { count: "exact", head: true }),
      supabase.from("swipes").select("id", { count: "exact", head: true }).gte("created_at", todayStart),
      supabase.from("reports").select("id", { count: "exact", head: true }),
      supabase.from("waitlist").select("id", { count: "exact", head: true }),
      // Time series data
      supabase.from("profiles").select("created_at").gte("created_at", thirtyDaysAgo).order("created_at"),
      supabase.from("matches").select("created_at, status").gte("created_at", thirtyDaysAgo).order("created_at"),
      supabase.from("items").select("category").eq("status", "active"),
      supabase.from("waitlist").select("created_at").gte("created_at", thirtyDaysAgo).order("created_at"),
    ]);

    // Group by day helper
    const groupByDay = (rows: { created_at: string }[] | null) => {
      const map: Record<string, number> = {};
      (rows || []).forEach((r) => {
        const day = r.created_at.slice(0, 10);
        map[day] = (map[day] || 0) + 1;
      });
      return Object.entries(map).map(([date, count]) => ({ date, count }));
    };

    // Group items by category
    const categoryMap: Record<string, number> = {};
    (itemsByCategoryRes.data || []).forEach((r: { category: string }) => {
      categoryMap[r.category] = (categoryMap[r.category] || 0) + 1;
    });
    const itemsByCategory = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

    // Match acceptance rate
    const matchStatuses: Record<string, number> = {};
    (matchesByDayRes.data || []).forEach((r: { status: string }) => {
      matchStatuses[r.status] = (matchStatuses[r.status] || 0) + 1;
    });

    const stats = {
      kpis: {
        totalUsers: profilesRes.count || 0,
        activeItems: itemsRes.count || 0,
        totalMatches: matchesRes.count || 0,
        matchesToday: matchesTodayRes.count || 0,
        totalMessages: messagesRes.count || 0,
        swipesToday: swipesRes.count || 0,
        pendingReports: reportsRes.count || 0,
        waitlistCount: waitlistRes.count || 0,
        acceptanceRate: matchStatuses.accepted
          ? Math.round(
              (matchStatuses.accepted /
                (matchStatuses.accepted +
                  (matchStatuses.rejected || 0) +
                  (matchStatuses.pending || 0))) *
                100
            )
          : 0,
      },
      charts: {
        usersByDay: groupByDay(profilesByDayRes.data),
        matchesByDay: groupByDay(matchesByDayRes.data as { created_at: string }[] | null),
        itemsByCategory,
        waitlistByDay: groupByDay(waitlistByDayRes.data),
      },
    };

    return new Response(JSON.stringify(stats), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
