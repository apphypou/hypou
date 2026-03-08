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
  isMock?: boolean;
}

// Mock videos for demo when no real videos exist
const MOCK_VIDEOS: ShortVideo[] = [
  {
    id: "mock-1",
    video_url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    item_id: "mock-item-1",
    user_id: "mock-user-1",
    view_count: 1243,
    like_count: 89,
    thumbnail_url: null,
    created_at: new Date().toISOString(),
    item: { id: "mock-item-1", name: "iPhone 15 Pro Max", market_value: 650000, category: "Celulares" },
    profile: { user_id: "mock-user-1", display_name: "Lucas Silva", avatar_url: null },
    isMock: true,
  },
  {
    id: "mock-2",
    video_url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    item_id: "mock-item-2",
    user_id: "mock-user-2",
    view_count: 876,
    like_count: 54,
    thumbnail_url: null,
    created_at: new Date().toISOString(),
    item: { id: "mock-item-2", name: "PlayStation 5", market_value: 400000, category: "Videogames" },
    profile: { user_id: "mock-user-2", display_name: "Ana Oliveira", avatar_url: null },
    isMock: true,
  },
  {
    id: "mock-3",
    video_url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    item_id: "mock-item-3",
    user_id: "mock-user-3",
    view_count: 2310,
    like_count: 198,
    thumbnail_url: null,
    created_at: new Date().toISOString(),
    item: { id: "mock-item-3", name: "MacBook Air M2", market_value: 850000, category: "Eletrônicos" },
    profile: { user_id: "mock-user-3", display_name: "Pedro Costa", avatar_url: null },
    isMock: true,
  },
  {
    id: "mock-4",
    video_url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    item_id: "mock-item-4",
    user_id: "mock-user-4",
    view_count: 543,
    like_count: 32,
    thumbnail_url: null,
    created_at: new Date().toISOString(),
    item: { id: "mock-item-4", name: "Tênis Nike Air Max", market_value: 120000, category: "Moda" },
    profile: { user_id: "mock-user-4", display_name: "Maria Santos", avatar_url: null },
    isMock: true,
  },
  {
    id: "mock-5",
    video_url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    item_id: "mock-item-5",
    user_id: "mock-user-5",
    view_count: 1890,
    like_count: 145,
    thumbnail_url: null,
    created_at: new Date().toISOString(),
    item: { id: "mock-item-5", name: "Guitarra Fender Stratocaster", market_value: 350000, category: "Instrumentos" },
    profile: { user_id: "mock-user-5", display_name: "João Mendes", avatar_url: null },
    isMock: true,
  },
  {
    id: "mock-6",
    video_url: "https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    item_id: "mock-item-6",
    user_id: "mock-user-6",
    view_count: 3200,
    like_count: 267,
    thumbnail_url: null,
    created_at: new Date().toISOString(),
    item: { id: "mock-item-6", name: 'Smart TV Samsung 55"', market_value: 280000, category: "Eletrônicos" },
    profile: { user_id: "mock-user-6", display_name: "Carla Ferreira", avatar_url: null },
    isMock: true,
  },
];

export type SortMode = "recent" | "trending" | "popular";

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

  // Sort
  if (sort === "trending") {
    query = query.order("like_count", { ascending: false });
  } else if (sort === "popular") {
    query = query.order("view_count", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw error;

  // If no real videos, return mocks
  if (!data || data.length === 0) {
    let mocks = [...MOCK_VIDEOS];
    if (category) {
      mocks = mocks.filter((m) => m.item?.category === category);
    }
    if (sort === "trending" || sort === "popular") {
      mocks.sort((a, b) => (sort === "trending" ? b.like_count - a.like_count : b.view_count - a.view_count));
    }
    return mocks;
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
