import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  });
};

export const useMessages = (conversationId: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => getMessages(conversationId!),
    enabled: !!conversationId && !!user,
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
      queryClient.setQueryData<Message[]>(["messages", conversationId], (old) => {
        if (!old) return [newMsg];
        if (old.some((m) => m.id === newMsg.id)) {
          return old.map((m) => (m.id === newMsg.id ? newMsg : m));
        }
        return [...old, newMsg];
      });

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
      queryClient.setQueryData<Message[]>(["messages", conversationId], (old) => {
        if (!old) return [msg];
        if (old.some((m) => m.id === msg.id)) return old;
        return [...old, msg];
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};

export const useUploadChatMedia = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ file, type }: { file: File; type: MessageType }) => {
      if (!user) throw new Error("Not authenticated");
      return uploadChatMedia(user.id, file, type);
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
