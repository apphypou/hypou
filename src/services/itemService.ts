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

export const validateItemPrice = async (
  name: string,
  category: string,
  condition: string,
  valueCents: number,
  description?: string
): Promise<{
  valid: boolean;
  reason: string;
  suggestedMin: number;
  suggestedMax: number;
}> => {
  try {
    const { data, error } = await supabase.functions.invoke("validate-item-price", {
      body: { name, category, condition, value_cents: valueCents, description },
    });
    if (error) throw error;
    return {
      valid: data.valid ?? true,
      reason: data.reason ?? "",
      suggestedMin: data.suggested_min_cents ?? 0,
      suggestedMax: data.suggested_max_cents ?? 0,
    };
  } catch (err) {
    console.error("Price validation failed, allowing item:", err);
    return { valid: true, reason: "", suggestedMin: 0, suggestedMax: 0 };
  }
};

export const getExploreItems = async (userId: string, page = 0, pageSize = 50) => {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from("items")
    .select(`*, item_images (id, image_url, position), item_videos (id, video_url, thumbnail_url)`)
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
      .select("user_id, display_name, avatar_url, location, created_at")
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

/** Public version for guest mode - no user filtering */
export const getPublicExploreItems = async (page = 0, pageSize = 50) => {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from("items")
    .select(`*, item_images (id, image_url, position)`)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw error;

  const ownerIds = [...new Set((data || []).map((i) => i.user_id))];
  let profileMap: Record<string, any> = {};
  if (ownerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url, location, created_at")
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

/** Fetch items near a location using the nearby_items RPC */
export const getNearbyItems = async (
  lat: number,
  lng: number,
  radiusKm: number,
  userId?: string,
  limit = 50
) => {
  const { data, error } = await supabase.rpc("nearby_items", {
    p_lat: lat,
    p_lng: lng,
    p_radius_km: radiusKm,
    p_user_id: userId || null,
    p_limit: limit,
  });
  if (error) throw error;

  // Fetch images and profiles for these items
  const itemIds = (data || []).map((i: any) => i.id);
  const ownerIds = [...new Set((data || []).map((i: any) => i.user_id))];

  let imageMap: Record<string, any[]> = {};
  let profileMap: Record<string, any> = {};

  if (itemIds.length > 0) {
    const { data: images } = await supabase
      .from("item_images")
      .select("id, item_id, image_url, position")
      .in("item_id", itemIds);
    (images || []).forEach((img) => {
      if (!imageMap[img.item_id]) imageMap[img.item_id] = [];
      imageMap[img.item_id].push(img);
    });
  }

  if (ownerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url, location, created_at")
      .in("user_id", ownerIds as string[]);
    (profiles || []).forEach((p) => { profileMap[p.user_id] = p; });
  }

  return (data || [])
    .filter((item: any) => imageMap[item.id]?.length > 0)
    .map((item: any) => ({
      ...item,
      item_images: imageMap[item.id] || [],
      profiles: profileMap[item.user_id] || { display_name: null, avatar_url: null, location: null },
    }));
};
