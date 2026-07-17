import { supabase } from "@/integrations/supabase/client";

export const createReport = async (reporterId: string, reportedUserId: string, reason: string, description?: string) => {
  const { error } = await supabase
    .from("reports")
    .insert({ reporter_id: reporterId, reported_user_id: reportedUserId, reason, description });
  if (error) throw error;
};

export const blockUser = async (blockerId: string, blockedId: string) => {
  const { error } = await supabase
    .from("blocked_users")
    .upsert(
      { blocker_id: blockerId, blocked_id: blockedId },
      { onConflict: "blocker_id,blocked_id", ignoreDuplicates: true },
    );
  if (error) throw error;
};

export const unblockUser = async (blockerId: string, blockedId: string) => {
  const { error } = await supabase
    .from("blocked_users")
    .delete()
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId);
  if (error) throw error;
};

export const getBlockedUserIds = async (blockerId: string) => {
  const { data, error } = await supabase
    .from("blocked_users")
    .select("blocked_id")
    .eq("blocker_id", blockerId);

  if (error) throw error;

  return (data || []).map((row) => row.blocked_id);
};

export const getBlockedUsers = async (blockerId: string) => {
  const { data, error } = await supabase
    .from("blocked_users")
    .select("blocked_id, created_at")
    .eq("blocker_id", blockerId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  if (!data || data.length === 0) return [];

  const blockedIds = data.map((b) => b.blocked_id);
  const { data: profiles } = await supabase
    .from("public_profiles" as any)
    .select("user_id, display_name, avatar_url")
    .in("user_id", blockedIds);

  const profilesById = new Map(((profiles || []) as any[]).map((profile) => [profile.user_id, profile]));

  // A block is still valid if the profile was deleted or is hidden by RLS.
  // Keep it visible so the user can remove the block instead of making it disappear.
  return data.map((block) => {
    const profile = profilesById.get(block.blocked_id);
    return {
      user_id: block.blocked_id,
      display_name: profile?.display_name || "Usuário bloqueado",
      avatar_url: profile?.avatar_url || null,
      blocked_at: block.created_at,
    };
  });
};

export const isConversationBlocked = async (conversationId: string) => {
  const { data, error } = await supabase.rpc("is_conversation_blocked" as never, {
    p_conversation_id: conversationId,
  } as never);

  if (error) throw error;
  return Boolean(data);
};
