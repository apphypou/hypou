import { supabase } from "@/integrations/supabase/client";

export const fetchShortsFeed = async (page = 0, pageSize = 10) => {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from("item_videos")
    .select("*")
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw error;

  if (!data || data.length === 0) return [];

  // Fetch related items
  const itemIds = [...new Set(data.map((v) => v.item_id))];
  const { data: items } = await supabase
    .from("items")
    .select("id, name, market_value, category, item_images(image_url, position)")
    .in("id", itemIds);

  const itemMap: Record<string, any> = {};
  (items || []).forEach((i) => { itemMap[i.id] = i; });

  // Fetch profiles
  const userIds = [...new Set(data.map((v) => v.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, display_name, avatar_url")
    .in("user_id", userIds);

  const profileMap: Record<string, any> = {};
  (profiles || []).forEach((p) => { profileMap[p.user_id] = p; });

  return data.map((video) => ({
    ...video,
    item: itemMap[video.item_id] || null,
    profile: profileMap[video.user_id] || null,
  }));
};

export const uploadVideo = async (
  userId: string,
  itemId: string,
  file: File
): Promise<{ videoUrl: string; videoId: string }> => {
  const ext = file.name.split(".").pop() || "mp4";
  const path = `${userId}/${itemId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("item-videos")
    .upload(path, file, { upsert: true });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("item-videos").getPublicUrl(path);
  const videoUrl = data.publicUrl;

  const { data: record, error: dbError } = await supabase
    .from("item_videos")
    .insert({ item_id: itemId, user_id: userId, video_url: videoUrl })
    .select()
    .single();
  if (dbError) throw dbError;

  return { videoUrl, videoId: record.id };
};

export const deleteVideo = async (videoId: string) => {
  const { error } = await supabase
    .from("item_videos")
    .delete()
    .eq("id", videoId);
  if (error) throw error;
};
