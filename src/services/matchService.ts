import { supabase } from "@/integrations/supabase/client";

export interface MatchWithDetails {
  id: string;
  status: string;
  created_at: string;
  confirmed_by_a?: boolean;
  confirmed_by_b?: boolean;
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
      id, status, created_at, updated_at, user_a_id, user_b_id, confirmed_by_a, confirmed_by_b,
      item_a:item_a_id (id, name, market_value, category, location, item_images (image_url, position)),
      item_b:item_b_id (id, name, market_value, category, location, item_images (image_url, position))
    `)
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const otherUserIds = (data || []).map((m: any) =>
    m.user_a_id === userId ? m.user_b_id : m.user_a_id
  ).filter(Boolean);

  const uniqueIds = [...new Set(otherUserIds)];
  
  let profilesMap: Record<string, any> = {};
  if (uniqueIds.length > 0) {
    const { data: profiles } = await supabase
      .from("public_profiles" as any)
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
      confirmed_by_a: m.confirmed_by_a,
      confirmed_by_b: m.confirmed_by_b,
      item_a: m.item_a,
      item_b: m.item_b,
      other_user: profilesMap[otherUserId] || { user_id: otherUserId, display_name: null, avatar_url: null, location: null },
      my_item_side: isUserA ? "a" : "b",
    };
  });
};

export const createProposal = async (
  userId: string,
  myItemId: string,
  theirItemId: string,
  theirUserId: string
) => {
  const { data, error } = await supabase
    .from("matches")
    .insert({
      user_a_id: userId,
      user_b_id: theirUserId,
      item_a_id: myItemId,
      item_b_id: theirItemId,
      status: "proposal",
    })
    .select("id")
    .single();
  if (error) throw error;
  return data;
};

export const acceptProposal = async (matchId: string, currentUserId: string) => {
  const { data: match, error: fetchErr } = await supabase
    .from("matches")
    .select("user_b_id, status")
    .eq("id", matchId)
    .single();

  if (fetchErr || !match) throw new Error("Proposta não encontrada");
  if (match.user_b_id !== currentUserId) throw new Error("Apenas o dono do item pode aceitar a proposta");
  if (match.status !== "proposal") throw new Error("Esta proposta já foi respondida");

  const { error: updateError } = await supabase
    .from("matches")
    .update({ status: "accepted" })
    .eq("id", matchId)
    .eq("status", "proposal");
  if (updateError) throw updateError;

  const { error: convError } = await supabase
    .from("conversations")
    .insert({ match_id: matchId });
  if (convError && !convError.message?.includes("duplicate")) throw convError;
};

export const rejectProposal = async (matchId: string, currentUserId: string) => {
  const { data: match, error: fetchErr } = await supabase
    .from("matches")
    .select("user_b_id, status")
    .eq("id", matchId)
    .single();

  if (fetchErr || !match) throw new Error("Proposta não encontrada");
  if (match.user_b_id !== currentUserId) throw new Error("Apenas o dono do item pode recusar a proposta");
  if (match.status !== "proposal") throw new Error("Esta proposta já foi respondida");

  const { error } = await supabase
    .from("matches")
    .update({ status: "rejected" })
    .eq("id", matchId)
    .eq("status", "proposal");
  if (error) throw error;
};

export const confirmTrade = async (matchId: string, userId: string) => {
  const { data: match, error: fetchErr } = await supabase
    .from("matches")
    .select("user_a_id, user_b_id, status")
    .eq("id", matchId)
    .single();

  if (fetchErr || !match) throw new Error("Troca não encontrada");
  if (match.status !== "accepted") throw new Error("Esta troca não pode ser confirmada");

  const isUserA = match.user_a_id === userId;
  const isUserB = match.user_b_id === userId;
  if (!isUserA && !isUserB) throw new Error("Você não faz parte desta troca");

  const updateField = isUserA ? "confirmed_by_a" : "confirmed_by_b";

  const { error } = await supabase
    .from("matches")
    .update({ [updateField]: true })
    .eq("id", matchId);
  if (error) throw error;
};

export const getMatch = async (matchId: string, userId: string): Promise<MatchWithDetails | null> => {
  const { data, error } = await supabase
    .from("matches")
    .select(`
      id, status, created_at, updated_at, user_a_id, user_b_id, confirmed_by_a, confirmed_by_b,
      item_a:item_a_id (id, name, market_value, category, location, item_images (image_url, position)),
      item_b:item_b_id (id, name, market_value, category, location, item_images (image_url, position))
    `)
    .eq("id", matchId)
    .single();

  if (error) return null;

  const isUserA = data.user_a_id === userId;
  const otherUserId = isUserA ? data.user_b_id : data.user_a_id;

  const { data: profile } = await supabase
    .from("public_profiles" as any)
    .select("user_id, display_name, avatar_url, location")
    .eq("user_id", otherUserId)
    .single();

  return {
    id: data.id,
    status: data.status,
    created_at: data.created_at,
    confirmed_by_a: (data as any).confirmed_by_a,
    confirmed_by_b: (data as any).confirmed_by_b,
    item_a: data.item_a as any,
    item_b: data.item_b as any,
    other_user: profile || { user_id: otherUserId, display_name: null, avatar_url: null, location: null },
    my_item_side: isUserA ? "a" : "b",
  };
};
