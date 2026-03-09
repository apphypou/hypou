import { supabase } from "@/integrations/supabase/client";

export type MessageType = 'text' | 'image' | 'video' | 'audio';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: MessageType;
  media_url: string | null;
  read_at: string | null;
  created_at: string;
}

export interface ConversationWithDetails {
  id: string;
  match_id: string;
  created_at: string;
  other_user: {
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  other_item: {
    name: string;
    market_value: number;
    image_url: string | null;
  };
  my_item: {
    name: string;
  };
  last_message: Message | null;
  unread_count: number;
  match_status: string;
}

export const getConversations = async (userId: string): Promise<ConversationWithDetails[]> => {
  // Get all conversations via matches
  const { data: matches, error: matchErr } = await supabase
    .from("matches")
    .select(`
      id, status, user_a_id, user_b_id,
      item_a:item_a_id (id, name, market_value, item_images (image_url, position)),
      item_b:item_b_id (id, name, market_value, item_images (image_url, position)),
      conversations (id, created_at)
    `)
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
    .order("updated_at", { ascending: false });

  if (matchErr) throw matchErr;
  if (!matches || matches.length === 0) return [];

  // Collect other user IDs and conversation IDs
  const otherUserIds = new Set<string>();
  const conversationIds: string[] = [];

  matches.forEach((m: any) => {
    const otherId = m.user_a_id === userId ? m.user_b_id : m.user_a_id;
    otherUserIds.add(otherId);
    const conv = Array.isArray(m.conversations) ? m.conversations[0] : m.conversations;
    if (conv) conversationIds.push(conv.id);
  });

  // Fetch profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, display_name, avatar_url")
    .in("user_id", [...otherUserIds]);

  const profileMap: Record<string, any> = {};
  (profiles || []).forEach((p) => { profileMap[p.user_id] = p; });

  // Fetch last message for each conversation
  const lastMessages: Record<string, Message> = {};
  const unreadCounts: Record<string, number> = {};

  if (conversationIds.length > 0) {
    // Get latest message per conversation (fetch all messages, we'll group)
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false });

    const seen = new Set<string>();
    (msgs || []).forEach((msg: Message) => {
      if (!seen.has(msg.conversation_id)) {
        lastMessages[msg.conversation_id] = msg;
        seen.add(msg.conversation_id);
      }
      // Count unread (messages not from me, without read_at)
      if (msg.sender_id !== userId && !msg.read_at) {
        unreadCounts[msg.conversation_id] = (unreadCounts[msg.conversation_id] || 0) + 1;
      }
    });
  }

  return matches.map((m: any) => {
    const isUserA = m.user_a_id === userId;
    const otherId = isUserA ? m.user_b_id : m.user_a_id;
    const otherItem = isUserA ? m.item_b : m.item_a;
    const myItem = isUserA ? m.item_a : m.item_b;
    const conv = Array.isArray(m.conversations) ? m.conversations[0] : m.conversations;
    const convId = conv?.id;

    return {
      id: convId || m.id,
      match_id: m.id,
      created_at: conv?.created_at || m.created_at,
      other_user: profileMap[otherId] || { user_id: otherId, display_name: null, avatar_url: null },
      other_item: {
        name: otherItem?.name || "Item",
        market_value: otherItem?.market_value || 0,
        image_url: otherItem?.item_images?.[0]?.image_url || null,
      },
      my_item: { name: myItem?.name || "Item" },
      last_message: convId ? (lastMessages[convId] || null) : null,
      unread_count: convId ? (unreadCounts[convId] || 0) : 0,
      match_status: m.status,
    };
  }).filter((c: any) => c.id);
};

export const getMessages = async (conversationId: string): Promise<Message[]> => {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data || []).map((m: any) => ({ ...m, message_type: m.message_type as MessageType }));
};

export const sendMessage = async (
  conversationId: string,
  senderId: string,
  content: string,
  messageType: MessageType = 'text',
  mediaUrl: string | null = null
) => {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      message_type: messageType,
      media_url: mediaUrl,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const uploadChatMedia = async (
  userId: string,
  file: File,
  type: MessageType
): Promise<string> => {
  const ext = file.name.split('.').pop() || (type === 'audio' ? 'webm' : 'jpg');
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("chat-media")
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from("chat-media").getPublicUrl(path);
  return data.publicUrl;
};

export const markMessagesAsRead = async (conversationId: string, userId: string) => {
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .is("read_at", null);
};

export const subscribeToMessages = (
  conversationId: string,
  onMessage: (msg: Message) => void
) => {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        onMessage(payload.new as Message);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
