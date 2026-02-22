import { supabase } from "@/integrations/supabase/client";

export const createItem = async (data: {
  user_id: string;
  name: string;
  description?: string;
  category: string;
  market_value: number;
  location?: string;
  margin_up: number;
  margin_down: number;
}) => {
  const { data: item, error } = await supabase
    .from("items")
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return item;
};

export const updateItem = async (itemId: string, data: {
  margin_up?: number;
  margin_down?: number;
}) => {
  const { error } = await supabase
    .from("items")
    .update(data)
    .eq("id", itemId);
  if (error) throw error;
};

export const uploadItemImage = async (userId: string, itemId: string, file: File, position: number): Promise<string> => {
  const ext = file.name.split(".").pop();
  const path = `${userId}/${itemId}/${position}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("item-images")
    .upload(path, file, { upsert: true });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("item-images").getPublicUrl(path);
  const imageUrl = data.publicUrl;

  const { error: dbError } = await supabase
    .from("item_images")
    .insert({ item_id: itemId, image_url: imageUrl, position });
  if (dbError) throw dbError;

  return imageUrl;
};

export const getExploreItems = async (userId: string) => {
  // Get items user already swiped
  const { data: swipedItems } = await supabase
    .from("swipes")
    .select("item_id")
    .eq("swiper_id", userId);

  const swipedIds = (swipedItems || []).map((s) => s.item_id);

  let query = supabase
    .from("items")
    .select(`*, item_images (id, image_url, position)`)
    .eq("status", "active")
    .neq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (swipedIds.length > 0) {
    query = query.not("id", "in", `(${swipedIds.join(",")})`);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Fetch profiles for item owners separately
  const ownerIds = [...new Set((data || []).map((i) => i.user_id))];
  let profileMap: Record<string, any> = {};
  if (ownerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url, location")
      .in("user_id", ownerIds);
    (profiles || []).forEach((p) => { profileMap[p.user_id] = p; });
  }

  return (data || []).map((item) => ({
    ...item,
    profiles: profileMap[item.user_id] || { display_name: null, avatar_url: null, location: null },
  }));
};
