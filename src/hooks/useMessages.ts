import { useInfiniteQuery, useQuery, useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeInvalidate } from "@/hooks/useRealtimeInvalidate";
import {
  getConversations,
  getMessages,
  sendMessage,
  deleteMessage,
  markMessagesAsRead,
  subscribeToMessages,
  uploadChatMedia,
  archiveConversation,
  archiveConversations,
  markConversationHypeOpened,
  unarchiveConversation,
  type ConversationArchiveMode,
  CHAT_MESSAGE_PAGE_SIZE,
  type Message,
  type MessageType,
} from "@/services/messageService";

export const useConversations = (archiveMode: ConversationArchiveMode = "main") => {
  const { user } = useAuth();

  // Realtime: refresh list when new conversations are created or matches change status
  useRealtimeInvalidate(
    user
      ? [
          { table: "conversations", invalidateKeys: [["conversations", user.id]] },
          { table: "matches", invalidateKeys: [["conversations", user.id]] },
          { table: "messages", invalidateKeys: [["conversations", user.id]] },
        ]
      : [],
    !!user
  );

  return useQuery({
    queryKey: ["conversations", user?.id, archiveMode],
    queryFn: () => getConversations(user!.id, archiveMode),
    enabled: !!user,
    staleTime: 30_000,
  });
};

type MessagePages = InfiniteData<Message[], string | null>;

const upsertMessageInPages = (current: MessagePages | undefined, message: Message): MessagePages => {
  if (!current) return { pages: [[message]], pageParams: [null] };

  let found = false;
  const pages = current.pages.map((page) => page.map((existing) => {
    if (existing.id !== message.id) return existing;
    found = true;
    return message;
  }));

  if (!found) pages[0] = [...(pages[0] || []), message];
  return { ...current, pages };
};

export const useMessages = (conversationId: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: ["messages", conversationId],
    queryFn: ({ pageParam }) => getMessages(conversationId!, pageParam || undefined),
    initialPageParam: null as string | null,
    getNextPageParam: (oldestPage) =>
      oldestPage.length === CHAT_MESSAGE_PAGE_SIZE ? oldestPage[0]?.created_at || undefined : undefined,
    select: (data) => [...data.pages].reverse().flat(),
    enabled: !!conversationId && !!user,
    staleTime: 30_000,
  });

  // Mark as read when viewing
  useEffect(() => {
    if (conversationId && user && query.data && query.data.length > 0) {
      markMessagesAsRead(conversationId, user.id);
    }
  }, [conversationId, user, query.data]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = subscribeToMessages(conversationId, (raw: any) => {
      if (!raw?.id) return;
      const newMsg: Message = { ...raw, message_type: raw.message_type as MessageType };
      queryClient.setQueryData<MessagePages>(["messages", conversationId], (old) =>
        upsertMessageInPages(old, newMsg));

      // Also refresh conversations list for last_message update
      queryClient.invalidateQueries({ queryKey: ["conversations"] });

      // System messages can change match status (completion/cancellation)
      if (newMsg.message_type === 'system') {
        queryClient.invalidateQueries({ queryKey: ["conversation-detail", conversationId] });
        queryClient.invalidateQueries({ queryKey: ["matches"] });
      }

      // Mark as read if it's from the other user
      if (user && newMsg.sender_id !== user.id) {
        markMessagesAsRead(conversationId, user.id);
      }
    });

    return unsubscribe;
  }, [conversationId, queryClient, user]);

  return query;
};

export const useMarkConversationHypeOpened = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => {
      if (!user) throw new Error("Not authenticated");
      return markConversationHypeOpened(conversationId, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};

export const useDeleteMessage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId }: { messageId: string; conversationId: string }) => {
      if (!user) throw new Error("Not authenticated");
      return deleteMessage(messageId, user.id);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["messages", variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};

export const useSendMessage = (conversationId: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ content, messageType = 'text', mediaUrl = null }: { content: string; messageType?: MessageType; mediaUrl?: string | null }) => {
      if (!conversationId || !user) throw new Error("Not ready");
      return sendMessage(conversationId, user.id, content, messageType, mediaUrl);
    },
    onSuccess: (newMsg) => {
      const msg: Message = { ...newMsg, message_type: newMsg.message_type as MessageType };
      queryClient.setQueryData<MessagePages>(["messages", conversationId], (old) =>
        upsertMessageInPages(old, msg));
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};

export const useUploadChatMedia = (conversationId: string | null) => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ file, type }: { file: File; type: MessageType }) => {
      if (!user || !conversationId) throw new Error("Not ready");
      return uploadChatMedia(conversationId, user.id, file, type);
    },
  });
};

export const useArchiveConversation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => {
      if (!user) throw new Error("Not authenticated");
      return archiveConversation(conversationId, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};

export const useArchiveConversations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationIds: string[]) => {
      if (!user) throw new Error("Not authenticated");
      return archiveConversations(conversationIds, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};

export const useUnarchiveConversation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => {
      if (!user) throw new Error("Not authenticated");
      return unarchiveConversation(conversationId, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};
