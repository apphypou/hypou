import { supabase } from "@/integrations/supabase/client";

export interface MatchWithDetails {
  id: string;
  status: string;
  created_at: string;
  item_a: {
    id: string;
    name: string;
    market_value: number;
    category: string;
    location: string | null;
    item_images: { image_url: string; position: number }[];
  };
  item_b: {
    id: string;
    name: string;
    market_value: number;
    category: string;
    location: string | null;
    item_images: { image_url: string; position: number }[];
  };
  other_user: {
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
    location: string | null;
  };
  my_item_side: "a" | "b";
}

export const getMatches = async (userId: string): Promise<MatchWithDetails[]> => {
  const { data, error } = await supabase
    .from("matches")
    .select(`
      id, status, created_at, updated_at, user_a_id, user_b_id,
      item_a:item_a_id (id, name, market_value, category, location, item_images (image_url, position)),
      item_b:item_b_id (id, name, market_value, category, location, item_images (image_url, position))
    `)
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Fetch profiles for the other users
  const otherUserIds = (data || []).map((m: any) =>
    m.user_a_id === userId ? m.user_b_id : m.user_a_id
  ).filter(Boolean);

  const uniqueIds = [...new Set(otherUserIds)];
  
  let profilesMap: Record<string, any> = {};
  if (uniqueIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url, location")
      .in("user_id", uniqueIds);
    
    (profiles || []).forEach((p) => {
      profilesMap[p.user_id] = p;
    });
  }

  return (data || []).map((m: any) => {
    const isUserA = m.user_a_id === userId;
    const otherUserId = isUserA ? m.user_b_id : m.user_a_id;
    return {
      id: m.id,
      status: m.status,
      created_at: m.created_at,
      item_a: m.item_a,
      item_b: m.item_b,
      other_user: profilesMap[otherUserId] || { user_id: otherUserId, display_name: null, avatar_url: null, location: null },
      my_item_side: isUserA ? "a" : "b",
    };
  });
};

export const getMatch = async (matchId: string, userId: string): Promise<MatchWithDetails | null> => {
  const { data, error } = await supabase
    .from("matches")
    .select(`
      id, status, created_at, updated_at, user_a_id, user_b_id,
      item_a:item_a_id (id, name, market_value, category, location, item_images (image_url, position)),
      item_b:item_b_id (id, name, market_value, category, location, item_images (image_url, position))
    `)
    .eq("id", matchId)
    .single();

  if (error) return null;

  const isUserA = data.user_a_id === userId;
  const otherUserId = isUserA ? data.user_b_id : data.user_a_id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, display_name, avatar_url, location")
    .eq("user_id", otherUserId)
    .single();

  return {
    id: data.id,
    status: data.status,
    created_at: data.created_at,
    item_a: data.item_a as any,
    item_b: data.item_b as any,
    other_user: profile || { user_id: otherUserId, display_name: null, avatar_url: null, location: null },
    my_item_side: isUserA ? "a" : "b",
  };
};
