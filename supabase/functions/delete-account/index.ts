import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.97.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify the user's JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create anon client to verify user
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

    const userId = user.id;

    // Use service role client for cleanup + auth deletion
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Delete user data in dependency order
    // 1. Get user's matches to clean conversations/messages
    const { data: userMatches } = await adminClient
      .from("matches")
      .select("id")
      .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);

    if (userMatches && userMatches.length > 0) {
      const matchIds = userMatches.map((m) => m.id);
      // Messages will cascade from conversations, conversations from matches
    }

    // 2. Delete ratings (both given and received)
    await adminClient.from("ratings").delete().or(`rater_id.eq.${userId},rated_id.eq.${userId}`);

    // 3. Delete reports filed by user
    await adminClient.from("reports").delete().eq("reporter_id", userId);

    // 4. Delete notifications
    await adminClient.from("notifications").delete().eq("user_id", userId);

    // 5. Delete blocked users
    await adminClient.from("blocked_users").delete().or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);

    // 6. Delete video likes
    await adminClient.from("video_likes").delete().eq("user_id", userId);

    // 7. Delete matches (cascades to conversations → messages)
    await adminClient.from("matches").delete().or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);

    // 8. Delete favorites, swipes, categories
    await adminClient.from("favorites").delete().eq("user_id", userId);
    await adminClient.from("swipes").delete().eq("swiper_id", userId);
    await adminClient.from("user_categories").delete().eq("user_id", userId);
    await adminClient.from("user_roles").delete().eq("user_id", userId);

    // 9. Delete items (cascades to item_images, item_videos)
    await adminClient.from("items").delete().eq("user_id", userId);

    // 10. Delete profile
    await adminClient.from("profiles").delete().eq("user_id", userId);

    // 11. Delete auth user
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
