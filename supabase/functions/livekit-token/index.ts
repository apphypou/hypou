// LiveKit token issuer for video/audio calls in chat conversations.
// Validates that the caller participates in the conversation, then mints a short-lived
// AccessToken signed with the project's LIVEKIT_API_KEY/SECRET.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { AccessToken } from "npm:livekit-server-sdk@2";
import { z } from "npm:zod@3";

const BodySchema = z.object({
  action: z.enum(["start", "join"]),
  conversation_id: z.string().uuid().optional(),
  kind: z.enum(["video", "audio"]).optional(),
  call_session_id: z.string().uuid().optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LIVEKIT_API_KEY = Deno.env.get("LIVEKIT_API_KEY");
    const LIVEKIT_API_SECRET = Deno.env.get("LIVEKIT_API_SECRET");
    const LIVEKIT_URL = Deno.env.get("LIVEKIT_URL");
    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
      return json({ error: "LiveKit não configurado" }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);
    const userId = claimsData.claims.sub as string;

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const { action, conversation_id, kind, call_session_id } = parsed.data;

    let session: any = null;

    if (action === "start") {
      if (!conversation_id || !kind) return json({ error: "conversation_id e kind obrigatórios" }, 400);

      // Get conversation -> match -> identify the other user
      const { data: conv, error: convErr } = await supabase
        .from("conversations")
        .select("id, match_id, matches:match_id(user_a_id, user_b_id)")
        .eq("id", conversation_id)
        .maybeSingle();
      if (convErr || !conv) return json({ error: "Conversa não encontrada" }, 404);
      const m: any = (conv as any).matches;
      if (!m) return json({ error: "Match não encontrado" }, 404);
      if (m.user_a_id !== userId && m.user_b_id !== userId) return json({ error: "Forbidden" }, 403);
      const calleeId = m.user_a_id === userId ? m.user_b_id : m.user_a_id;

      // Block check
      const { data: blocked } = await supabase
        .from("blocked_users")
        .select("id")
        .or(`and(blocker_id.eq.${userId},blocked_id.eq.${calleeId}),and(blocker_id.eq.${calleeId},blocked_id.eq.${userId})`)
        .maybeSingle();
      if (blocked) return json({ error: "Usuário bloqueado" }, 403);

      const { data: created, error: insErr } = await supabase
        .from("call_sessions")
        .insert({
          conversation_id,
          caller_id: userId,
          callee_id: calleeId,
          kind,
        })
        .select("*")
        .single();
      if (insErr) return json({ error: insErr.message }, 400);
      session = created;
    } else {
      // join
      if (!call_session_id) return json({ error: "call_session_id obrigatório" }, 400);
      const { data: cs, error: csErr } = await supabase
        .from("call_sessions")
        .select("*")
        .eq("id", call_session_id)
        .maybeSingle();
      if (csErr || !cs) return json({ error: "Chamada não encontrada" }, 404);
      if (cs.caller_id !== userId && cs.callee_id !== userId) return json({ error: "Forbidden" }, 403);
      if (["declined", "missed", "ended"].includes(cs.status)) return json({ error: "Chamada encerrada" }, 410);
      session = cs;
    }

    // Get display name
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", userId)
      .maybeSingle();

    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: userId,
      name: profile?.display_name ?? "Usuário",
      ttl: 60 * 60, // 1h
    });
    at.addGrant({
      room: session.room_name,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });
    const jwt = await at.toJwt();

    return json({
      token: jwt,
      url: LIVEKIT_URL,
      room_name: session.room_name,
      call_session_id: session.id,
      kind: session.kind,
      caller_id: session.caller_id,
      callee_id: session.callee_id,
      conversation_id: session.conversation_id,
    });
  } catch (e) {
    console.error("livekit-token error", e);
    return json({ error: (e as Error).message ?? "Erro interno" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
