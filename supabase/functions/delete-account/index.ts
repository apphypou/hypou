import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const uuidSchema = z.string().uuid();
    const parseResult = uuidSchema.safeParse(user.id);
    if (!parseResult.success) {
      return new Response(JSON.stringify({ error: "Invalid user ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = parseResult.data;

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // C6: storage cleanup — apaga prefixos do usuário em todos os buckets de mídia
    const buckets = ["chat-media", "avatars", "item-images", "item-videos"];
    for (const bucket of buckets) {
      try {
        const { data: files } = await adminClient.storage.from(bucket).list(userId, { limit: 1000 });
        if (files && files.length > 0) {
          const paths = files.map((f) => `${userId}/${f.name}`);
          await adminClient.storage.from(bucket).remove(paths);
        }
        // Também tenta subpastas (ex: chat-media/userId/itemId/file)
        const { data: subdirs } = await adminClient.storage.from(bucket).list(userId, { limit: 1000 });
        for (const sd of subdirs || []) {
          const { data: nested } = await adminClient.storage.from(bucket).list(`${userId}/${sd.name}`, { limit: 1000 });
          if (nested && nested.length > 0) {
            await adminClient.storage.from(bucket).remove(nested.map((f) => `${userId}/${sd.name}/${f.name}`));
          }
        }
      } catch (e) {
        console.error(`storage cleanup failed for ${bucket}:`, e);
      }
    }

    // C6: cleanup completo das tabelas que carregam user_id
    await adminClient.from("ratings").delete().or(`rater_id.eq.${userId},rated_id.eq.${userId}`);
    await adminClient.from("reports").delete().or(`reporter_id.eq.${userId},reported_user_id.eq.${userId}`);
    await adminClient.from("notifications").delete().eq("user_id", userId);
    await adminClient.from("blocked_users").delete().or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);
    await adminClient.from("video_likes").delete().eq("user_id", userId);
    await adminClient.from("device_tokens").delete().eq("user_id", userId);
    await adminClient.from("call_sessions").delete().or(`caller_id.eq.${userId},callee_id.eq.${userId}`);
    await adminClient.from("messages").delete().eq("sender_id", userId);
    await adminClient.from("match_items").delete().eq("user_id", userId);
    await adminClient.from("matches").delete().or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);
    await adminClient.from("favorites").delete().eq("user_id", userId);
    await adminClient.from("swipes").delete().eq("swiper_id", userId);
    await adminClient.from("user_categories").delete().eq("user_id", userId);
    await adminClient.from("user_roles").delete().eq("user_id", userId);
    await adminClient.from("item_videos").delete().eq("user_id", userId);
    await adminClient.from("items").delete().eq("user_id", userId);
    await adminClient.from("ai_validation_throttle").delete().eq("user_id", userId);
    await adminClient.from("profiles").delete().eq("user_id", userId);

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
