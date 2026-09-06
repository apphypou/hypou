import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function listStoragePaths(client: ReturnType<typeof createClient>, bucket: string, root: string) {
  const pending = [root];
  const paths: string[] = [];
  while (pending.length > 0) {
    const folder = pending.pop()!;
    for (let offset = 0; ; offset += 100) {
      const { data, error } = await client.storage.from(bucket).list(folder, { limit: 100, offset });
      if (error) throw error;
      for (const entry of data || []) {
        const path = `${folder}/${entry.name}`;
        if (entry.id) paths.push(path);
        else pending.push(path);
      }
      if (!data || data.length < 100) break;
    }
  }
  return paths;
}

async function removeStoragePaths(client: ReturnType<typeof createClient>, bucket: string, paths: string[]) {
  for (let offset = 0; offset < paths.length; offset += 100) {
    const { error } = await client.storage.from(bucket).remove(paths.slice(offset, offset + 100));
    if (error) throw error;
  }
}

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

    // Remove every object before deleting the auth identity. Failures abort the
    // request so cleanup can be retried instead of reporting a false success.
    const buckets = ["chat-media", "avatars", "item-images", "item-videos"];
    for (const bucket of buckets) {
      const paths = await listStoragePaths(adminClient, bucket, userId);
      await removeStoragePaths(adminClient, bucket, paths);
    }

    const privatePaths: string[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await adminClient
        .from("messages")
        .select("media_url")
        .eq("sender_id", userId)
        .like("media_url", "chat-media-private:%")
        .range(offset, offset + 999);
      if (error) throw error;
      privatePaths.push(...(data || []).map((row) => row.media_url?.replace("chat-media-private:", "")).filter(Boolean) as string[]);
      if (!data || data.length < 1000) break;
    }
    await removeStoragePaths(adminClient, "chat-media-private", privatePaths);

    const deletions = [
      adminClient.from("ratings").delete().or(`rater_id.eq.${userId},rated_id.eq.${userId}`),
      adminClient.from("reports").delete().or(`reporter_id.eq.${userId},reported_user_id.eq.${userId}`),
      adminClient.from("notifications").delete().eq("user_id", userId),
      adminClient.from("blocked_users").delete().or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`),
      adminClient.from("video_likes").delete().eq("user_id", userId),
      adminClient.from("device_tokens").delete().eq("user_id", userId),
      adminClient.from("call_sessions").delete().or(`caller_id.eq.${userId},callee_id.eq.${userId}`),
      adminClient.from("messages").delete().eq("sender_id", userId),
      adminClient.from("match_items").delete().eq("user_id", userId),
      adminClient.from("matches").delete().or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`),
      adminClient.from("favorites").delete().eq("user_id", userId),
      adminClient.from("swipes").delete().eq("swiper_id", userId),
      adminClient.from("user_categories").delete().eq("user_id", userId),
      adminClient.from("user_roles").delete().eq("user_id", userId),
      adminClient.from("item_videos").delete().eq("user_id", userId),
      adminClient.from("items").delete().eq("user_id", userId),
      adminClient.from("ai_validation_throttle").delete().eq("user_id", userId),
      adminClient.from("profiles").delete().eq("user_id", userId),
    ];
    for (const deletion of deletions) {
      const { error } = await deletion;
      if (error) {
        throw error;
      }
    }

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
