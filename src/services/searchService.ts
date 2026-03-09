import { supabase } from "@/integrations/supabase/client";

export interface SearchFilters {
  query?: string;
  category?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
}

export const searchItems = async (userId: string, filters: SearchFilters) => {
  let q = supabase
    .from("items")
    .select(`*, item_images (id, image_url, position)`)
    .eq("status", "active")
    .neq("user_id", userId);

  if (filters.query && filters.query.trim()) {
    const term = `%${filters.query.trim()}%`;
    q = q.or(`name.ilike.${term},description.ilike.${term}`);
  }

  if (filters.category) {
    q = q.eq("category", filters.category);
  }

  if (filters.condition) {
    q = q.eq("condition", filters.condition);
  }

  if (filters.minPrice != null && filters.minPrice > 0) {
    q = q.gte("market_value", filters.minPrice);
  }

  if (filters.maxPrice != null && filters.maxPrice > 0) {
    q = q.lte("market_value", filters.maxPrice);
  }

  const { data, error } = await q
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  // Fetch profiles
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
