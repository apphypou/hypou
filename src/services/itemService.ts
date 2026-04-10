import { supabase } from "@/integrations/supabase/client";
import { getBlockedUserIds } from "@/services/reportService";
import { validateImageFile } from "@/lib/fileValidation";

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
  const validationError = validateImageFile(file);
  if (validationError) throw new Error(validationError);
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

/** Fetch recommended items for a logged-in user via RPC */
export const getRecommendedItems = async (userId: string, limit = 50) => {
  const blockedIds = await getBlockedUserIds(userId);

  const { data, error } = await supabase.rpc("recommended_items", {
    p_user_id: userId,
    p_limit: limit,
  });
  if (error) throw error;

  const rows = ((data || []) as any[]).filter((i) => !blockedIds.includes(i.user_id));
  const itemIds = rows.map((i) => i.id);
  const ownerIds = [...new Set(rows.map((i) => i.user_id))];

  let imageMap: Record<string, any[]> = {};
  let videoMap: Record<string, any[]> = {};
  let profileMap: Record<string, any> = {};

  if (itemIds.length > 0) {
    const [{ data: images }, { data: videos }] = await Promise.all([
      supabase.from("item_images").select("id, item_id, image_url, position").in("item_id", itemIds),
      supabase.from("item_videos").select("id, item_id, video_url, thumbnail_url").in("item_id", itemIds),
    ]);
    (images || []).forEach((img) => {
      if (!imageMap[img.item_id]) imageMap[img.item_id] = [];
      imageMap[img.item_id].push(img);
    });
    (videos || []).forEach((vid) => {
      if (!videoMap[vid.item_id]) videoMap[vid.item_id] = [];
      videoMap[vid.item_id].push(vid);
    });
  }

  if (ownerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("public_profiles" as any)
      .select("user_id, display_name, avatar_url, location, created_at")
      .in("user_id", ownerIds as string[]);
    (profiles || []).forEach((p: any) => { profileMap[p.user_id] = p; });
  }

  return rows
    .filter((item) => imageMap[item.id]?.length > 0)
    .map((item) => ({
      ...item,
      item_images: imageMap[item.id] || [],
      item_videos: videoMap[item.id] || [],
      profiles: profileMap[item.user_id] || { display_name: null, avatar_url: null, location: null },
      matched_own_item: item.matched_item_id
        ? { id: item.matched_item_id, name: item.matched_item_name, image_url: item.matched_item_image }
        : null,
      matched_items_count: item.matched_items_count ?? 0,
    }));
};

/** Public version for guest mode - no user filtering */
export const getPublicExploreItems = async (page = 0, pageSize = 50) => {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from("items")
    .select(`*, item_images (id, image_url, position), item_videos (id, video_url, thumbnail_url)`)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw error;

  const ownerIds = [...new Set((data || []).map((i) => i.user_id))];
  let profileMap: Record<string, any> = {};
  if (ownerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("public_profiles" as any)
      .select("user_id, display_name, avatar_url, location, created_at")
      .in("user_id", ownerIds);
    (profiles || []).forEach((p: any) => { profileMap[p.user_id] = p; });
  }

  return (data || [])
    .filter((item) => item.item_images && item.item_images.length > 0)
    .map((item) => ({
      ...item,
      profiles: profileMap[item.user_id] || { display_name: null, avatar_url: null, location: null },
      matched_own_item: null,
    }));
};
