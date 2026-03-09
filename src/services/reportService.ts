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
    .insert({ blocker_id: blockerId, blocked_id: blockedId });
  if (error && !error.message?.includes("duplicate")) throw error;
};

export const unblockUser = async (blockerId: string, blockedId: string) => {
  const { error } = await supabase
    .from("blocked_users")
    .delete()
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId);
  if (error) throw error;
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
    .from("profiles")
    .select("user_id, display_name, avatar_url")
    .in("user_id", blockedIds);

  return (profiles || []).map((p) => ({
    ...p,
    blocked_at: data.find((b) => b.blocked_id === p.user_id)?.created_at,
  }));
};
