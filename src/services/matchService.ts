import { supabase } from "@/integrations/supabase/client";

export interface MatchWithDetails {
  id: string;
  status: string;
  created_at: string;
  cash_amount_cents?: number;
  cash_payer_user_id?: string | null;
  cancelled_at?: string | null;
  cancelled_by?: string | null;
  cancellation_reason?: string | null;
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
  items_a?: Array<{
    id: string;
    name: string;
    market_value: number;
    category: string;
    location: string | null;
    item_images: { image_url: string; position: number }[];
  }>;
  items_b?: Array<{
    id: string;
    name: string;
    market_value: number;
    category: string;
    location: string | null;
    item_images: { image_url: string; position: number }[];
  }>;
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
      id, status, created_at, updated_at, user_a_id, user_b_id, confirmed_by_a, confirmed_by_b, cash_amount_cents, cash_payer_user_id, cancelled_at, cancelled_by, cancellation_reason,
      item_a:item_a_id (id, name, market_value, category, location, item_images (image_url, position)),
      item_b:item_b_id (id, name, market_value, category, location, item_images (image_url, position))
    `)
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Conversations remain available after a block for safety, moderation and evidence.
  const filteredData = data || [];

  const otherUserIds = filteredData.map((m: any) =>
    m.user_a_id === userId ? m.user_b_id : m.user_a_id
  ).filter(Boolean);

  const uniqueIds = [...new Set(otherUserIds)];
  
  let profilesMap: Record<string, any> = {};
  if (uniqueIds.length > 0) {
    const { data: profiles } = await supabase
      .from("public_profiles" as any)
      .select("user_id, display_name, avatar_url, location")
      .in("user_id", uniqueIds);
    
    ((profiles || []) as any[]).forEach((p) => {
      profilesMap[p.user_id] = p;
    });
  }

  // Load match_items (multi-item proposals) for these matches
  const matchIds = filteredData.map((m: any) => m.id);
  const itemsBySideMap: Record<string, { a: any[]; b: any[] }> = {};
  if (matchIds.length > 0) {
    const { data: miRows } = await supabase
      .from("match_items" as any)
      .select(`
        match_id, side,
        item:item_id (id, name, market_value, category, location, item_images (image_url, position))
      `)
      .in("match_id", matchIds);
    ((miRows || []) as any[]).forEach((row: any) => {
      const bucket = (itemsBySideMap[row.match_id] = itemsBySideMap[row.match_id] || { a: [], b: [] });
      if (row.item) bucket[row.side as "a" | "b"].push(row.item);
    });
  }

  return filteredData.map((m: any) => {
    const isUserA = m.user_a_id === userId;
    const otherUserId = isUserA ? m.user_b_id : m.user_a_id;
    const buckets = itemsBySideMap[m.id] || { a: [], b: [] };
    const items_a = buckets.a.length > 0 ? buckets.a : (m.item_a ? [m.item_a] : []);
    const items_b = buckets.b.length > 0 ? buckets.b : (m.item_b ? [m.item_b] : []);
    return {
      id: m.id,
      status: m.status,
      created_at: m.created_at,
      cash_amount_cents: m.cash_amount_cents || 0,
      cash_payer_user_id: m.cash_payer_user_id || null,
      cancelled_at: m.cancelled_at || null,
      cancelled_by: m.cancelled_by || null,
      cancellation_reason: m.cancellation_reason || null,
      confirmed_by_a: m.confirmed_by_a,
      confirmed_by_b: m.confirmed_by_b,
      item_a: m.item_a,
      item_b: m.item_b,
      items_a,
      items_b,
      other_user: profilesMap[otherUserId] || { user_id: otherUserId, display_name: null, avatar_url: null, location: null },
      my_item_side: isUserA ? "a" : "b",
    };
  });
};

export const createProposal = async (
  _userId: string,
  myItemIds: string | string[],
  theirItemId: string,
  _theirUserId: string,
  cashAmountCents = 0
) => {
  const ids = Array.isArray(myItemIds) ? myItemIds : [myItemIds];
  if (ids.length === 0) throw new Error("Selecione ao menos 1 item");
  if (ids.length > 3) throw new Error("Máximo de 3 itens por proposta");

  const { data, error } = await supabase.rpc("create_proposal" as any, {
    p_my_item_ids: ids,
    p_their_item_id: theirItemId,
    p_cash_amount_cents: Math.max(0, cashAmountCents || 0),
  });
  if (error) throw new Error(getProposalErrorMessage(error));
  return { id: data as unknown as string };
};

export const getProposalErrorMessage = (error: { code?: string; message?: string }) => {
  const message = error.message || "Não foi possível enviar a proposta.";
  if (
    error.code === "PGRST202" &&
    message.includes("create_proposal") &&
    message.includes("p_cash_amount_cents")
  ) {
    return "O banco do Hypou precisa ser atualizado para aceitar proposta com dinheiro. A migration de completar com dinheiro ainda não foi aplicada no Supabase.";
  }
  return message;
};

export const acceptProposal = async (matchId: string) => {
  const { data, error } = await supabase.rpc("accept_match", { p_match_id: matchId });
  if (error) throw error;
  if (!data) throw new Error("Não foi possível aceitar esta proposta");
};

export const rejectProposal = async (matchId: string) => {
  const { data, error } = await supabase.rpc("reject_match", { p_match_id: matchId });
  if (error) throw error;
  if (!data) throw new Error("Não foi possível recusar esta proposta");
};

export const cancelProposal = async (matchId: string) => {
  const { data, error } = await supabase.rpc("cancel_match" as any, {
    p_match_id: matchId,
  });

  if (error) throw error;
  if (!data) throw new Error("Não foi possível cancelar esta negociação");
};

export const confirmTrade = async (matchId: string) => {
  const { data, error } = await supabase.rpc("confirm_trade_delivery", { p_match_id: matchId });
  if (error) throw error;
  if (!data) throw new Error("Não foi possível confirmar esta troca");
};

export const getMatch = async (matchId: string, userId: string): Promise<MatchWithDetails | null> => {
  const { data, error } = await supabase
    .from("matches")
    .select(`
      id, status, created_at, updated_at, user_a_id, user_b_id, confirmed_by_a, confirmed_by_b, cash_amount_cents, cash_payer_user_id, cancelled_at, cancelled_by, cancellation_reason,
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
    cash_amount_cents: (data as any).cash_amount_cents || 0,
    cash_payer_user_id: (data as any).cash_payer_user_id || null,
    cancelled_at: (data as any).cancelled_at || null,
    cancelled_by: (data as any).cancelled_by || null,
    cancellation_reason: (data as any).cancellation_reason || null,
    confirmed_by_a: (data as any).confirmed_by_a,
    confirmed_by_b: (data as any).confirmed_by_b,
    item_a: data.item_a as any,
    item_b: data.item_b as any,
    other_user: (profile as any) || { user_id: otherUserId, display_name: null, avatar_url: null, location: null },
    my_item_side: isUserA ? "a" : "b",
  };
};
