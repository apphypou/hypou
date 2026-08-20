import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const count = (value: { count: number | null }) => value.count || 0;

function daysWithZeros(rows: { created_at: string }[] | null, days = 30) {
  const values = new Map<string, number>();
  for (const row of rows || []) {
    const day = row.created_at.slice(0, 10);
    values.set(day, (values.get(day) || 0) + 1);
  }
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - (days - index - 1));
    const day = date.toISOString().slice(0, 10);
    return { date: day, count: values.get(day) || 0 };
  });
}

function retentionForDay(
  profiles: { user_id: string; created_at: string }[],
  openEvents: { user_id: string | null; occurred_at: string }[],
  days: number,
) {
  const now = Date.now();
  const day = 86_400_000;
  const cohort = profiles.filter((profile) => {
    const age = now - new Date(profile.created_at).getTime();
    return age >= days * day && age < (days + 1) * day;
  });
  if (!cohort.length) return null;

  const retained = cohort.filter((profile) => {
    const createdAt = new Date(profile.created_at).getTime();
    return openEvents.some((event) => event.user_id === profile.user_id && (() => {
      const elapsed = new Date(event.occurred_at).getTime() - createdAt;
      return elapsed >= days * day && elapsed < (days + 1) * day;
    })());
  }).length;
  return Math.round((retained / cohort.length) * 100);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");
    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const callerClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await callerClient.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const admin = createClient(url, serviceKey);
    const { data: role } = await admin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!role) return Response.json({ error: "Forbidden" }, { status: 403, headers: corsHeaders });

    const requested = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const periodDays = [7, 30, 90].includes(Number(requested.periodDays)) ? Number(requested.periodDays) : 30;
    const now = new Date();
    const periodStart = new Date(now.getTime() - periodDays * 86_400_000).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000).toISOString();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 86_400_000).toISOString();
    const today = new Date(now); today.setHours(0, 0, 0, 0);

    const [profiles, activeItems, matches, messages, swipesToday, pendingReports, waitlist, profilesByDay, matchesByDay, itemsByCategory, waitlistByDay, ratings, active7d, active30d, active90d, allItems, productEvents, attribution, spend, nps, retentionProfiles] = await Promise.all([
      admin.from("profiles").select("id", { count: "exact", head: true }),
      admin.from("items").select("id", { count: "exact", head: true }).eq("status", "active"),
      admin.from("matches").select("id, status, user_a_id, user_b_id, created_at"),
      admin.from("messages").select("id", { count: "exact", head: true }),
      admin.from("swipes").select("id", { count: "exact", head: true }).gte("created_at", today.toISOString()),
      admin.from("reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
      admin.from("waitlist").select("id", { count: "exact", head: true }),
      admin.from("profiles").select("created_at").gte("created_at", periodStart),
      admin.from("matches").select("created_at").gte("created_at", periodStart),
      admin.from("items").select("category").eq("status", "active"),
      admin.from("waitlist").select("created_at").gte("created_at", periodStart),
      admin.from("ratings").select("score"),
      admin.from("user_app_presence").select("user_id", { count: "exact", head: true }).gte("last_seen", sevenDaysAgo),
      admin.from("user_app_presence").select("user_id", { count: "exact", head: true }).gte("last_seen", thirtyDaysAgo),
      admin.from("user_app_presence").select("user_id", { count: "exact", head: true }).gte("last_seen", ninetyDaysAgo),
      admin.from("items").select("user_id"),
      admin.from("product_events").select("event_name, user_id, occurred_at, platform").gte("occurred_at", ninetyDaysAgo),
      admin.from("acquisition_attribution").select("source, medium, campaign"),
      admin.from("marketing_spend").select("amount_cents").gte("period_end", thirtyDaysAgo.slice(0, 10)),
      admin.from("nps_responses").select("score").gte("created_at", ninetyDaysAgo),
      admin.from("profiles").select("user_id, created_at").gte("created_at", new Date(now.getTime() - 91 * 86_400_000).toISOString()),
    ]);

    const matchRows = matches.data || [];
    const statuses = (status: string) => matchRows.filter((match) => match.status === status).length;
    const completedTrades = statuses("completed");
    const progressedTrades = completedTrades + statuses("accepted");
    const resolvedTrades = completedTrades + statuses("cancelled") + statuses("rejected");
    const itemOwners = new Set((allItems.data || []).map((item) => item.user_id));
    const tradeParticipants = new Set(matchRows.flatMap((match) => [match.user_a_id, match.user_b_id]));
    const events = productEvents.data || [];
    const eventUsers = (eventName: string) => new Set(events.filter((event) => event.event_name === eventName && event.user_id).map((event) => event.user_id)).size;
    const categories = new Map<string, number>();
    for (const item of itemsByCategory.data || []) categories.set(item.category, (categories.get(item.category) || 0) + 1);
    const ratingsData = ratings.data || [];
    const averageRating = ratingsData.length ? ratingsData.reduce((sum, rating) => sum + rating.score, 0) / ratingsData.length : null;
    const npsData = nps.data || [];
    const npsScore = npsData.length ? Math.round(((npsData.filter((entry) => entry.score >= 9).length - npsData.filter((entry) => entry.score <= 6).length) / npsData.length) * 100) : null;
    const totalSpendCents = (spend.data || []).reduce((sum, entry) => sum + entry.amount_cents, 0);
    const openEvents = events.filter((event) => event.event_name === "app_opened" || event.event_name === "session_started");
    const totalUsers = count(profiles);
    const attributedUsers = (attribution.data || []).filter((entry) => entry.source).length;

    return Response.json({
      kpis: { totalUsers, activeItems: count(activeItems), totalMatches: matchRows.length, totalMessages: count(messages), swipesToday: count(swipesToday), pendingReports: count(pendingReports), waitlistCount: count(waitlist), activationRate: totalUsers ? Math.round((itemOwners.size / totalUsers) * 100) : 0, completionRate: resolvedTrades ? Math.round((completedTrades / resolvedTrades) * 100) : 0, averageRating },
      validation: {
        acquisition: { signups: totalUsers, attributedUsers, sourceConfigured: attributedUsers > 0, cpaCents: totalUsers && totalSpendCents ? Math.round(totalSpendCents / totalUsers) : null },
        activation: { firstItem: itemOwners.size, firstSearch: eventUsers("search_performed"), firstTrade: tradeParticipants.size, activated: new Set([...itemOwners, ...tradeParticipants]).size },
        engagement: { wau: count(active7d), mau: count(active30d), active90d: count(active90d), interactions: events.length },
        liquidity: { itemsPublished: count(activeItems), tradesOpen: statuses("proposal") + statuses("accepted"), tradesProgressed: progressedTrades, completedTrades, progressRate: matchRows.length ? Math.round((progressedTrades / matchRows.length) * 100) : 0 },
        retention: {
          d7: retentionForDay(retentionProfiles.data || [], openEvents, 7),
          d30: retentionForDay(retentionProfiles.data || [], openEvents, 30),
          d90: retentionForDay(retentionProfiles.data || [], openEvents, 90),
          configured: openEvents.length > 0,
        },
        satisfaction: { averageRating, ratingsCount: ratingsData.length, nps: npsScore, npsResponses: npsData.length },
        monetization: { configured: false, paidUsers: 0, arpuCents: null, mrrCents: null, ltvCents: null },
      },
      charts: {
        usersByDay: daysWithZeros(profilesByDay.data, periodDays),
        matchesByDay: daysWithZeros(matchesByDay.data, periodDays),
        waitlistByDay: daysWithZeros(waitlistByDay.data, periodDays),
        itemsByCategory: [...categories.entries()].map(([name, value]) => ({ name, value })),
      },
      meta: { periodDays, updatedAt: now.toISOString() },
    }, { headers: corsHeaders });
  } catch (error) {
    const status = String(error).includes("Unauthorized") ? 401 : 500;
    return Response.json({ error: error instanceof Error ? error.message : "Erro inesperado" }, { status, headers: corsHeaders });
  }
});
