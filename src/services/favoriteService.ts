import { supabase } from "@/integrations/supabase/client";

export const addFavorite = async (userId: string, itemId: string) => {
  const { error } = await supabase
    .from("favorites")
    .insert({ user_id: userId, item_id: itemId });
  if (error && !error.message?.includes("duplicate")) throw error;
};

export const removeFavorite = async (userId: string, itemId: string) => {
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("item_id", itemId);
  if (error) throw error;
};

export const getFavorites = async (userId: string) => {
  const { data, error } = await supabase
    .from("favorites")
    .select("item_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  if (!data || data.length === 0) return [];

  const itemIds = data.map((f) => f.item_id);
  const { data: items } = await supabase
    .from("items")
    .select(`*, item_images (id, image_url, position)`)
    .in("id", itemIds)
    .eq("status", "active");

  // Fetch profiles
  const ownerIds = [...new Set((items || []).map((i) => i.user_id))];
  let profileMap: Record<string, any> = {};
  if (ownerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url, location")
      .in("user_id", ownerIds);
    (profiles || []).forEach((p) => { profileMap[p.user_id] = p; });
  }

  return (items || []).map((item) => ({
    ...item,
    profiles: profileMap[item.user_id] || { display_name: null, avatar_url: null, location: null },
  }));
};

export const isFavorited = async (userId: string, itemId: string): Promise<boolean> => {
  const { data } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("item_id", itemId)
    .maybeSingle();
  return !!data;
};
