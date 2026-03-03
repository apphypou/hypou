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
  name?: string;
  description?: string | null;
  category?: string;
  condition?: string | null;
  location?: string | null;
  market_value?: number;
  margin_up?: number;
  margin_down?: number;
}) => {
  const { error } = await supabase
    .from("items")
    .update(data)
    .eq("id", itemId);
  if (error) throw error;
};

export const getItemById = async (itemId: string) => {
  const { data, error } = await supabase
    .from("items")
    .select(`*, item_images (id, image_url, position)`)
    .eq("id", itemId)
    .single();
  if (error) throw error;
  return data;
};

export const deleteItemImage = async (imageId: string) => {
  const { error } = await supabase
    .from("item_images")
    .delete()
    .eq("id", imageId);
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

export const getExploreItems = async (userId: string, page = 0, pageSize = 50) => {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from("items")
    .select(`*, item_images (id, image_url, position)`)
    .eq("status", "active")
    .neq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);
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

  return (data || [])
    .filter((item) => item.item_images && item.item_images.length > 0)
    .map((item) => ({
      ...item,
      profiles: profileMap[item.user_id] || { display_name: null, avatar_url: null, location: null },
    }));
};
