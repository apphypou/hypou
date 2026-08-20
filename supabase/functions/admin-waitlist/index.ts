import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const requestSchema = z.object({
  action: z.enum(["list", "export"]),
  page: z.number().int().min(1).max(10_000).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
  query: z.string().max(120).optional(),
});

const safeSearch = (value: string | undefined) => (value || "").trim().replace(/[^a-zA-Z0-9@._+\-]/g, "");

async function requireStaff(authHeader: string) {
  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const callerClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: { user } } = await callerClient.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const admin = createClient(url, serviceKey);
  const { data: role } = await admin.from("user_roles").select("role").eq("user_id", user.id).in("role", ["admin", "moderator"]).maybeSingle();
  if (!role) throw new Error("Forbidden");
  return admin;
}

function entriesQuery(admin: ReturnType<typeof createClient>, query: string) {
  let request = admin
    .from("waitlist")
    .select("id, position, email, referral_code, referred_by, created_at, converted_at", { count: "exact" })
    .order("position", { ascending: true });

  if (query) request = request.or(`email.ilike.*${query}*,referral_code.ilike.*${query}*`);
  return request;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");
    const body = requestSchema.parse(await req.json());
    const admin = await requireStaff(authHeader);
    const query = safeSearch(body.query);

    if (body.action === "list") {
      const page = body.page || 1;
      const pageSize = body.pageSize || 25;
      const [{ data: entries, count, error }, { count: convertedCount, error: conversionError }] = await Promise.all([
        entriesQuery(admin, query).range((page - 1) * pageSize, page * pageSize - 1),
        admin.from("waitlist").select("id", { count: "exact", head: true }).not("converted_at", "is", null),
      ]);
      if (error || conversionError) throw error || conversionError;
      return Response.json({ entries: entries || [], total: count || 0, convertedCount: convertedCount || 0, page, pageSize }, { headers: corsHeaders });
    }

    const pageSize = 1000;
    const entries: Record<string, unknown>[] = [];
    for (let page = 0; page < 100; page += 1) {
      const { data, error } = await entriesQuery(admin, query).range(page * pageSize, page * pageSize + pageSize - 1);
      if (error) throw error;
      entries.push(...(data || []));
      if (!data || data.length < pageSize) break;
    }
    return Response.json({ entries }, { headers: corsHeaders });
  } catch (error) {
    const status = error instanceof z.ZodError ? 400 : String(error).includes("Unauthorized") ? 401 : String(error).includes("Forbidden") ? 403 : 500;
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro inesperado" }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
