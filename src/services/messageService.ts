import { supabase } from "@/integrations/supabase/client";
import { validateChatMedia, prepareImageForUpload } from "@/lib/fileValidation";
import { getLatestNonSystemMessagesByConversation } from "@/lib/conversationPreview";
import { sortConversationsByActivity } from "@/lib/conversationOrdering";
import { shouldShowInMainConversationList } from "@/lib/conversationArchive";

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'system';
export type ChatMediaKind = "image" | "video" | "audio";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: MessageType;
  media_url: string | null;
  read_at: string | null;
  created_at: string;
  deleted_at?: string | null;
  deleted_by?: string | null;
}

export const isDeletedMessage = (message: Pick<Message, "deleted_at">) => !!message.deleted_at;

export interface ConversationWithDetails {
  id: string;
  match_id: string;
  created_at: string;
  updated_at?: string | null;
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
  last_message_at?: string | null;
  unread_count: number;
  match_status: string;
  hype_opened_at?: string | null;
}

export const getConversationIdForMatch = async (matchId: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from("conversations")
    .select("id")
    .eq("match_id", matchId)
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? null;
};

export type ConversationArchiveMode = "main" | "archived" | "all";

export const getArchivedConversationIds = async (userId: string): Promise<Set<string>> => {
  const { data, error } = await (supabase as any)
    .from("conversation_archives")
    .select("conversation_id")
    .eq("user_id", userId);

  if (error) throw error;
  return new Set(((data || []) as Array<{ conversation_id: string }>).map((row) => row.conversation_id));
};

export const archiveConversation = async (conversationId: string, userId: string): Promise<void> => {
  await archiveConversations([conversationId], userId);
};

export const archiveConversations = async (conversationIds: string[], userId: string): Promise<void> => {
  const uniqueConversationIds = [...new Set(conversationIds)].filter(Boolean);
  if (uniqueConversationIds.length === 0) return;

  const { error } = await (supabase as any)
    .from("conversation_archives")
    .upsert(
      uniqueConversationIds.map((conversationId) => ({ conversation_id: conversationId, user_id: userId })),
      { onConflict: "user_id,conversation_id" },
    );

  if (error) throw error;
};

export const unarchiveConversation = async (conversationId: string, userId: string): Promise<void> => {
  const { error } = await (supabase as any)
    .from("conversation_archives")
    .delete()
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);

  if (error) throw error;
};

export const markConversationHypeOpened = async (conversationId: string, userId: string): Promise<void> => {
  const { error } = await (supabase as any)
    .from("conversation_hype_states")
    .upsert(
      { conversation_id: conversationId, user_id: userId, opened_at: new Date().toISOString() },
      { onConflict: "conversation_id,user_id" },
    );

  if (error) throw error;
};

export const getConversations = async (
  userId: string,
  archiveMode: ConversationArchiveMode = "main",
): Promise<ConversationWithDetails[]> => {
  // Get all conversations via matches
  const { data: matches, error: matchErr } = await supabase
    .from("matches")
    .select(`
      id, status, updated_at, user_a_id, user_b_id,
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
    .from("public_profiles" as any)
    .select("user_id, display_name, avatar_url")
    .in("user_id", [...otherUserIds]);

  const profileMap: Record<string, any> = {};
  ((profiles || []) as any[]).forEach((p) => { profileMap[p.user_id] = p; });

  // Fetch last visible message for each conversation.
  const lastMessages: Record<string, Message> = {};
  const unreadCounts: Record<string, number> = {};

  if (conversationIds.length > 0) {
    // Batch: fetch recent messages for all conversations at once
    const { data: allMessages } = await supabase
      .from("messages")
      .select("*")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false });

    if (allMessages) {
      const visibleMessages = (allMessages as Message[]).filter((message) => !message.deleted_at);
      Object.assign(lastMessages, getLatestNonSystemMessagesByConversation(visibleMessages));

      for (const msg of visibleMessages) {
        if (msg.sender_id !== userId && !msg.read_at) {
          unreadCounts[msg.conversation_id] = (unreadCounts[msg.conversation_id] || 0) + 1;
        }
      }
    }
  }

  const conversations = matches
    // Preserve the audit trail after a refusal, cancellation, block, or completed
    // trade. Sending remains controlled by the match status in Conversa.
    .filter((m: any) => ["accepted", "completed", "cancelled", "rejected"].includes(m.status))
    .map((m: any) => {
      const isUserA = m.user_a_id === userId;
      const otherId = isUserA ? m.user_b_id : m.user_a_id;
      const otherItem = isUserA ? m.item_b : m.item_a;
      const myItem = isUserA ? m.item_a : m.item_b;
      const conv = Array.isArray(m.conversations) ? m.conversations[0] : m.conversations;
      const convId = conv?.id;

      if (!convId) return null;

      const previewMsg = lastMessages[convId] || null;

      return {
        id: convId,
        match_id: m.id,
        created_at: conv?.created_at || m.created_at,
        updated_at: m.updated_at || null,
        last_message_at: previewMsg?.created_at || m.updated_at || conv?.created_at || null,
        other_user: profileMap[otherId] || { user_id: otherId, display_name: null, avatar_url: null },
        other_item: {
          name: otherItem?.name || "Item",
          market_value: otherItem?.market_value || 0,
          image_url: otherItem?.item_images?.[0]?.image_url || null,
        },
        my_item: { name: myItem?.name || "Item" },
        last_message: previewMsg,
        unread_count: unreadCounts[convId] || 0,
        match_status: m.status,
      };
    }).filter(Boolean) as ConversationWithDetails[];

  const sorted = sortConversationsByActivity(conversations);
  if (archiveMode === "all") return sorted;

  const archivedIds = await getArchivedConversationIds(userId);
  const { data: hypeStates, error: hypeStatesError } = await (supabase as any)
    .from("conversation_hype_states")
    .select("conversation_id, opened_at")
    .eq("user_id", userId);

  if (hypeStatesError) throw hypeStatesError;
  const hypeOpenedAtByConversation = new Map(
    ((hypeStates || []) as Array<{ conversation_id: string; opened_at: string }>)
      .map((state) => [state.conversation_id, state.opened_at]),
  );
  const conversationsWithHypeState = sorted.map((conversation) => ({
    ...conversation,
    hype_opened_at: hypeOpenedAtByConversation.get(conversation.id) || null,
  }));

  if (archiveMode === "archived") {
    return conversationsWithHypeState.filter((conversation) => archivedIds.has(conversation.id));
  }

  return conversationsWithHypeState.filter((conversation) =>
    shouldShowInMainConversationList(conversation, archivedIds, userId),
  );
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

export const deleteMessage = async (messageId: string, _userId: string) => {
  const { error } = await supabase.rpc("soft_delete_message" as any, { p_message_id: messageId });
  if (error) throw error;
};

export const uploadChatMedia = async (
  userId: string,
  file: File,
  type: MessageType
): Promise<string> => {
  const mediaType: ChatMediaKind = type === 'video' || type === 'audio' ? type : 'image';
  const validationError = validateChatMedia(file, mediaType);
  if (validationError) throw new Error(validationError);
  const finalFile = mediaType === 'image' ? await prepareImageForUpload(file) : file;
  const ext = finalFile.name.split('.').pop() || (type === 'audio' ? 'webm' : 'jpg');
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("chat-media")
    .upload(path, finalFile, { cacheControl: "3600", upsert: false, contentType: finalFile.type });

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
        event: "*",
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
