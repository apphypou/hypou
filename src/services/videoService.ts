import { supabase } from "@/integrations/supabase/client";

export interface ShortVideo {
  id: string;
  video_url: string;
  item_id: string;
  user_id: string;
  view_count: number;
  like_count: number;
  thumbnail_url: string | null;
  created_at: string;
  item: {
    id: string;
    name: string;
    market_value: number;
    category: string;
  } | null;
  profile: {
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  liked_by_me?: boolean;
}



export const fetchShortsFeed = async (
  page = 0,
  pageSize = 20,
  sort: SortMode = "recent",
  category?: string,
  userId?: string
): Promise<ShortVideo[]> => {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("item_videos")
    .select("*")
    .range(from, to);

  if (sort === "trending") {
    query = query.order("like_count", { ascending: false });
  } else if (sort === "popular") {
    query = query.order("view_count", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw error;

  if (!data || data.length === 0) {
    return [];
  }

  // Fetch related items
  const itemIds = [...new Set(data.map((v: any) => v.item_id))];
  const { data: items } = await supabase
    .from("items")
    .select("id, name, market_value, category")
    .in("id", itemIds);

  const itemMap: Record<string, any> = {};
  (items || []).forEach((i: any) => { itemMap[i.id] = i; });

  // Filter by category if needed
  let filtered = data;
  if (category) {
    filtered = data.filter((v: any) => itemMap[v.item_id]?.category === category);
  }

  // Fetch profiles
  const userIds = [...new Set(filtered.map((v: any) => v.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, display_name, avatar_url")
    .in("user_id", userIds);

  const profileMap: Record<string, any> = {};
  (profiles || []).forEach((p: any) => { profileMap[p.user_id] = p; });

  // Check which ones user liked
  let likedSet = new Set<string>();
  if (userId) {
    const videoIds = filtered.map((v: any) => v.id);
    const { data: likes } = await supabase
      .from("video_likes")
      .select("video_id")
      .eq("user_id", userId)
      .in("video_id", videoIds);
    (likes || []).forEach((l: any) => likedSet.add(l.video_id));
  }

  return filtered.map((video: any) => ({
    ...video,
    item: itemMap[video.item_id] || null,
    profile: profileMap[video.user_id] || null,
    liked_by_me: likedSet.has(video.id),
  }));
};

export const toggleLike = async (videoId: string): Promise<boolean> => {
  const { data, error } = await supabase.rpc("toggle_video_like", { p_video_id: videoId });
  if (error) throw error;
  return data as boolean;
};

export const incrementView = async (videoId: string): Promise<void> => {
  await supabase.rpc("increment_video_view", { p_video_id: videoId });
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

  // Generate thumbnail from video
  let thumbnailUrl: string | null = null;
  try {
    thumbnailUrl = await generateThumbnail(file, userId, itemId);
  } catch (e) {
    console.warn("Failed to generate thumbnail:", e);
  }

  const { data: record, error: dbError } = await supabase
    .from("item_videos")
    .insert({
      item_id: itemId,
      user_id: userId,
      video_url: videoUrl,
      thumbnail_url: thumbnailUrl,
    })
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

// Generate thumbnail from video first frame
async function generateThumbnail(
  file: File,
  userId: string,
  itemId: string
): Promise<string | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    video.onloadeddata = () => {
      video.currentTime = 0.5; // grab frame at 0.5s
    };

    video.onseeked = async () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(null); return; }
      ctx.drawImage(video, 0, 0);

      canvas.toBlob(async (blob) => {
        if (!blob) { resolve(null); return; }
        const path = `${userId}/${itemId}/thumb_${Date.now()}.jpg`;
        const { error } = await supabase.storage
          .from("item-videos")
          .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
        if (error) { resolve(null); return; }
        const { data } = supabase.storage.from("item-videos").getPublicUrl(path);
        resolve(data.publicUrl);
        URL.revokeObjectURL(video.src);
      }, "image/jpeg", 0.8);
    };

    video.onerror = () => resolve(null);
    video.src = URL.createObjectURL(file);
  });
}
