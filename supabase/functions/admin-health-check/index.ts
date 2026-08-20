import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Check = { component: string; status: "operational" | "major_outage"; latency_ms: number | null };

async function measure(component: string, operation: () => Promise<void>): Promise<Check> {
  const startedAt = Date.now();
  try {
    await operation();
    return { component, status: "operational", latency_ms: Date.now() - startedAt };
  } catch {
    return { component, status: "major_outage", latency_ms: Date.now() - startedAt };
  }
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const secret = Deno.env.get("HEALTH_CHECK_SECRET");
  if (!secret || request.headers.get("x-health-check-secret") !== secret) return new Response("Unauthorized", { status: 401 });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const checks = await Promise.all([
    measure("api", async () => undefined),
    measure("database", async () => {
      const { error } = await admin.from("profiles").select("id", { count: "exact", head: true });
      if (error) throw error;
    }),
    measure("auth", async () => {
      const { error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
      if (error) throw error;
    }),
    measure("storage", async () => {
      const { error } = await admin.storage.listBuckets();
      if (error) throw error;
    }),
  ]);

  const { error } = await admin.from("uptime_checks").insert(checks.map((check) => ({ ...check, checked_at: new Date().toISOString() })));
  if (error) return Response.json({ error: "Failed to save health checks" }, { status: 500 });

  return Response.json({ checks });
});
