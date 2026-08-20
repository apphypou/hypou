import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const requestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("list") }),
  z.object({ action: z.literal("invite"), email: z.string().email(), role: z.enum(["admin", "moderator"]) }),
  z.object({ action: z.literal("set_role"), userId: z.string().uuid(), role: z.enum(["admin", "moderator", "user"]) }),
  z.object({ action: z.literal("resend_invite"), userId: z.string().uuid() }),
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");

    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const callerClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) throw new Error("Unauthorized");

    const admin = createClient(url, serviceKey);
    const { data: role } = await admin.from("user_roles").select("role").eq("user_id", caller.id).eq("role", "admin").maybeSingle();
    if (!role) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = requestSchema.parse(await req.json());
    if (body.action === "list") {
      const [{ data: roles, error: rolesError }, { data: profiles, error: profilesError }, { data: authUsers, error: authUsersError }] = await Promise.all([
        admin.from("user_roles").select("user_id, role").in("role", ["admin", "moderator"]),
        admin.from("profiles").select("id, display_name, avatar_url, created_at"),
        admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      ]);
      if (rolesError || profilesError || authUsersError) throw rolesError || profilesError || authUsersError;
      const profileById = new Map((profiles || []).map((profile) => [profile.id, profile]));
      const userById = new Map((authUsers.users || []).map((member) => [member.id, member]));
      return Response.json({ members: (roles || []).map((member) => {
        const authUser = userById.get(member.user_id);
        return {
          ...member,
          profile: profileById.get(member.user_id) || null,
          email: authUser?.email || null,
          status: authUser?.email_confirmed_at ? "active" : "invited",
          lastAccessAt: authUser?.last_sign_in_at || null,
        };
      }) }, { headers: corsHeaders });
    }

    if (body.action === "invite") {
      const { data: invited, error } = await admin.auth.admin.inviteUserByEmail(body.email, { redirectTo: "https://hypou.app/admin/login" });
      if (error) throw error;
      await admin.from("user_roles").delete().eq("user_id", invited.user.id).in("role", ["admin", "moderator"]);
      await admin.from("user_roles").upsert({ user_id: invited.user.id, role: body.role }, { onConflict: "user_id,role" });
      await admin.from("admin_audit_logs").insert({ actor_id: caller.id, action: "admin_invited", target_id: invited.user.id, metadata: { role: body.role } });
      return Response.json({ member: { user_id: invited.user.id, role: body.role } }, { headers: corsHeaders });
    }

    if (body.action === "resend_invite") {
      const { data: invitedUser, error: userError } = await admin.auth.admin.getUserById(body.userId);
      if (userError || !invitedUser.user.email) throw userError || new Error("E-mail do membro não encontrado");
      if (invitedUser.user.email_confirmed_at) {
        return new Response(JSON.stringify({ error: "Este membro já ativou o acesso." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(invitedUser.user.email, { redirectTo: "https://hypou.app/admin/login" });
      if (inviteError) throw inviteError;
      await admin.from("admin_audit_logs").insert({ actor_id: caller.id, action: "admin_invite_resent", target_id: body.userId });
      return Response.json({ ok: true }, { headers: corsHeaders });
    }

    if (body.userId === caller.id && body.role !== "admin") {
      return new Response(JSON.stringify({ error: "Você não pode remover seu próprio acesso de administrador." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { count } = await admin.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "admin");
    const { data: targetRoles } = await admin.from("user_roles").select("role").eq("user_id", body.userId);
    if (count === 1 && targetRoles?.some((entry) => entry.role === "admin") && body.role !== "admin") {
      return new Response(JSON.stringify({ error: "O painel precisa manter ao menos um administrador." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    await admin.from("user_roles").delete().eq("user_id", body.userId).in("role", ["admin", "moderator"]);
    if (body.role !== "user") await admin.from("user_roles").insert({ user_id: body.userId, role: body.role });
    await admin.from("admin_audit_logs").insert({ actor_id: caller.id, action: "admin_role_changed", target_id: body.userId, metadata: { role: body.role } });
    return Response.json({ ok: true }, { headers: corsHeaders });
  } catch (error) {
    const status = error instanceof z.ZodError ? 400 : String(error).includes("Unauthorized") ? 401 : 500;
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro inesperado" }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
