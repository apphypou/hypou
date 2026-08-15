import { supabase } from "@/integrations/supabase/client";
import { getBlockedUserIds } from "@/services/reportService";
import { validateImageFile, prepareImageForUpload } from "@/lib/fileValidation";
import { describeMediaFile, logMediaDiagnostic, logMediaError } from "@/lib/mediaDiagnostics";

export const createItem = async (data: {
  user_id: string;
  name: string;
  description?: string;
  category: string;
  condition?: string;
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
    .select(`*, item_images (id, image_url, position, focal_x, focal_y, focal_scale)`)
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

export const softDeleteItem = async (itemId: string) => {
  const { error } = await supabase.rpc("soft_delete_item" as any, { p_item_id: itemId });
  if (error) throw error;
};

export const uploadItemImage = async (
  userId: string,
  itemId: string,
  file: File,
  position: number,
  focalPoint?: { focal_x?: number; focal_y?: number; focal_scale?: number },
  traceId?: string,
): Promise<string> => {
  logMediaDiagnostic("storage.image.validation_started", { position, ...describeMediaFile(file) }, traceId);
  const validationError = validateImageFile(file);
  if (validationError) {
    logMediaDiagnostic("storage.image.validation_rejected", { position, validationError }, traceId);
    throw new Error(validationError);
  }
  // Convert HEIC/HEIF (iOS default) to JPEG when running on the web.
  let finalFile: File;
  try {
    logMediaDiagnostic("storage.image.prepare_started", { position }, traceId);
    finalFile = await prepareImageForUpload(file);
    logMediaDiagnostic("storage.image.prepare_completed", { position, ...describeMediaFile(finalFile) }, traceId);
  } catch (error) {
    logMediaError("storage.image.prepare_failed", error, { position }, traceId);
    throw error;
  }
  const ext = finalFile.name.split(".").pop();
  const path = `${userId}/${itemId}/${position}.${ext}`;

  logMediaDiagnostic("storage.image.upload_started", { position, extension: ext || "unknown" }, traceId);
  const { error: uploadError } = await supabase.storage
    .from("item-images")
    .upload(path, finalFile, { upsert: true, contentType: finalFile.type });
  if (uploadError) {
    logMediaError("storage.image.upload_failed", uploadError, { position }, traceId);
    throw uploadError;
  }
  logMediaDiagnostic("storage.image.upload_completed", { position }, traceId);

  const { data } = supabase.storage.from("item-images").getPublicUrl(path);
  const imageUrl = data.publicUrl;

  const imageData = {
    item_id: itemId,
    image_url: imageUrl,
    position,
    focal_x: focalPoint?.focal_x ?? 50,
    focal_y: focalPoint?.focal_y ?? 50,
    focal_scale: focalPoint?.focal_scale ?? 1,
  };
  const { data: existing, error: lookupError } = await supabase
    .from("item_images")
    .select("id")
    .eq("item_id", itemId)
    .eq("position", position)
    .maybeSingle();
  if (lookupError) {
    logMediaError("storage.image.record_lookup_failed", lookupError, { position }, traceId);
    throw lookupError;
  }

  logMediaDiagnostic("storage.image.record_write_started", { position, mode: existing ? "update" : "insert" }, traceId);
  const { error: dbError } = existing
    ? await supabase.from("item_images").update(imageData).eq("id", existing.id)
    : await supabase.from("item_images").insert(imageData);
  if (dbError) {
    logMediaError("storage.image.record_write_failed", dbError, { position }, traceId);
    throw dbError;
  }
  logMediaDiagnostic("storage.image.record_write_completed", { position }, traceId);

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
  /** C4: true quando o validador não conseguiu opinar (timeout, sem chave, parse falho) */
  unavailable?: boolean;
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
      unavailable: !!data.unavailable,
    };
  } catch (err) {
    console.error("Price validation failed:", err);
    // C4: marca como unavailable em vez de fail-open silencioso
    return { valid: true, reason: "Validação indisponível", suggestedMin: 0, suggestedMax: 0, unavailable: true };
  }
};

/** Fetch recommended items for a logged-in user via RPC */
export const getRecommendedItems = async (userId: string, limit = 50) => {
  const blockedIdsPromise = getBlockedUserIds(userId);
  const recommendationsPromise = supabase.rpc("recommended_items", {
    p_user_id: userId,
    p_limit: limit,
  });
  const [blockedIds, { data, error }] = await Promise.all([blockedIdsPromise, recommendationsPromise]);
  if (error) throw error;

  const loadFallbackRows = async () => {
    const { data: fallback } = await supabase
      .from("items")
      .select("*, item_images!inner(id)")
      .eq("status", "active")
      .neq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    return ((fallback || []) as any[]).filter((i) => !blockedIds.includes(i.user_id));
  };

  const hydrateRows = async (sourceRows: any[]) => {
    const itemIds = sourceRows.map((i) => i.id);
    const ownerIds = [...new Set(sourceRows.map((i) => i.user_id))];

    let imageMap: Record<string, any[]> = {};
    let videoMap: Record<string, any[]> = {};
    let profileMap: Record<string, any> = {};

    if (itemIds.length > 0) {
      const [{ data: images }, { data: videos }] = await Promise.all([
        supabase.from("item_images").select("id, item_id, image_url, position, focal_x, focal_y, focal_scale").in("item_id", itemIds),
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

    return sourceRows.filter((item) => imageMap[item.id]?.length > 0).map((item) => ({
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

  let rows = ((data || []) as any[]).filter((i) => !blockedIds.includes(i.user_id));
  let items = await hydrateRows(rows);

  if (items.length < 3) {
    const fallbackItems = await hydrateRows(await loadFallbackRows());
    const seen = new Set(items.map((item) => item.id));
    items = [...items, ...fallbackItems.filter((item) => !seen.has(item.id))];
  }

  // Fallback after hydration: the RPC can return only items without photos,
  // which are hidden from Explorar. In that case, load active photographed items.
  if (items.length === 0) {
    rows = await loadFallbackRows();
    items = await hydrateRows(rows);
  }

  // Loop fallback: if the user already swiped through everything new,
  // re-surface items they previously interacted with so the feed never feels empty.
  if (items.length === 0) {
    const { data: swipes } = await supabase
      .from("swipes")
      .select("item_id")
      .eq("swiper_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    const swipedIds = [...new Set((swipes || []).map((s: any) => s.item_id))];
    if (swipedIds.length > 0) {
      const { data: seen } = await supabase
        .from("items")
        .select("*")
        .in("id", swipedIds)
        .eq("status", "active");
      const seenRows = ((seen || []) as any[]).filter(
        (i) => !blockedIds.includes(i.user_id) && i.user_id !== userId
      );
      items = await hydrateRows(seenRows);
    }
  }

  return items;
};

/** Public version for guest mode - no user filtering */
export const getPublicExploreItems = async (page = 0, pageSize = 50) => {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from("items")
    .select(`*, item_images (id, image_url, position, focal_x, focal_y, focal_scale), item_videos (id, video_url, thumbnail_url)`)
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
