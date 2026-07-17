import { supabase } from "@/integrations/supabase/client";
import { getBlockedUserIds } from "@/services/reportService";
import { validateVideoFile } from "@/lib/fileValidation";
import { describeMediaFile, logMediaDiagnostic, logMediaError } from "@/lib/mediaDiagnostics";

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

  // Get blocked user IDs to filter them out
  let blockedIds: string[] = [];
  if (userId) {
    blockedIds = await getBlockedUserIds(userId);
  }

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

  // Filter out blocked users' videos
  const visibleData = blockedIds.length > 0
    ? data.filter((v: any) => !blockedIds.includes(v.user_id))
    : data;

  // Fetch related items
  const itemIds = [...new Set(visibleData.map((v: any) => v.item_id))];
  const { data: items } = await supabase
    .from("items")
    .select("id, name, market_value, category")
    .in("id", itemIds);

  const itemMap: Record<string, any> = {};
  (items || []).forEach((i: any) => { itemMap[i.id] = i; });

  // Filter by category if needed
  let filtered = visibleData;
  if (category) {
    filtered = visibleData.filter((v: any) => itemMap[v.item_id]?.category === category);
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
  file: File,
  fallbackThumbnailUrl?: string | null,
  traceId?: string,
): Promise<{ videoUrl: string; videoId: string }> => {
  logMediaDiagnostic("storage.video.validation_started", describeMediaFile(file), traceId);
  const validationError = validateVideoFile(file);
  if (validationError) {
    logMediaDiagnostic("storage.video.validation_rejected", { validationError }, traceId);
    throw new Error(validationError);
  }

  const ext = file.name.toLowerCase().split(".").pop() || "mp4";
  const path = `${userId}/${itemId}/video.${ext}`;

  logMediaDiagnostic("storage.video.upload_started", { extension: ext }, traceId);
  const { error: uploadError } = await supabase.storage
    .from("item-videos")
    .upload(path, file, {
      upsert: true,
      contentType: file.type || (ext === "mov" ? "video/quicktime" : "video/mp4"),
    });
  if (uploadError) {
    logMediaError("storage.video.upload_failed", uploadError, undefined, traceId);
    throw uploadError;
  }
  logMediaDiagnostic("storage.video.upload_completed", undefined, traceId);

  const { data } = supabase.storage.from("item-videos").getPublicUrl(path);
  const videoUrl = data.publicUrl;

  // Generate thumbnail from video
  let thumbnailUrl: string | null = fallbackThumbnailUrl ?? null;
  try {
    logMediaDiagnostic("storage.video.thumbnail_started", undefined, traceId);
    thumbnailUrl = (await generateThumbnail(file, userId, itemId)) ?? thumbnailUrl;
  } catch (e) {
    logMediaError("storage.video.thumbnail_failed", e, undefined, traceId);
  }

  // A tabela permite somente um vídeo por item e não possui policy de UPDATE.
  // Remover antes de inserir mantém tentativas de upload idempotentes sob RLS.
  const { error: deleteError } = await supabase
    .from("item_videos")
    .delete()
    .eq("item_id", itemId)
    .eq("user_id", userId);
  if (deleteError) {
    logMediaError("storage.video.record_delete_failed", deleteError, undefined, traceId);
    throw deleteError;
  }
  logMediaDiagnostic("storage.video.record_delete_completed", undefined, traceId);

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
  if (dbError) {
    logMediaError("storage.video.record_write_failed", dbError, undefined, traceId);
    const { error: cleanupError } = await supabase.storage.from("item-videos").remove([path]);
    if (cleanupError) logMediaError("storage.video.cleanup_failed", cleanupError, undefined, traceId);
    throw dbError;
  }
  logMediaDiagnostic("storage.video.record_write_completed", undefined, traceId);

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
    const objectUrl = URL.createObjectURL(file);
    let settled = false;
    const finish = (value: string | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      URL.revokeObjectURL(objectUrl);
      resolve(value);
    };
    const timeoutId = window.setTimeout(() => finish(null), 5_000);

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
      if (!ctx) { finish(null); return; }
      ctx.drawImage(video, 0, 0);

      canvas.toBlob(async (blob) => {
        if (!blob) { finish(null); return; }
        const path = `${userId}/${itemId}/thumb_${Date.now()}.jpg`;
        const { error } = await supabase.storage
          .from("item-videos")
          .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
        if (error) { finish(null); return; }
        const { data } = supabase.storage.from("item-videos").getPublicUrl(path);
        finish(data.publicUrl);
      }, "image/jpeg", 0.8);
    };

    video.onerror = () => finish(null);
    video.src = objectUrl;
  });
}
