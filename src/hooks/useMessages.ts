import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  getConversations,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  subscribeToMessages,
  uploadChatMedia,
  type Message,
  type MessageType,
} from "@/services/messageService";

export const useConversations = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: () => getConversations(user!.id),
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30s as fallback
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
      const newMsg: Message = { ...raw, message_type: raw.message_type as MessageType };
      queryClient.setQueryData<Message[]>(["messages", conversationId], (old) => {
        if (!old) return [newMsg];
        // Avoid duplicates
        if (old.some((m) => m.id === newMsg.id)) return old;
        return [...old, newMsg];
      });

      // Also refresh conversations list for last_message update
      queryClient.invalidateQueries({ queryKey: ["conversations"] });

      // Mark as read if it's from the other user
      if (user && newMsg.sender_id !== user.id) {
        markMessagesAsRead(conversationId, user.id);
      }
    });

    return unsubscribe;
  }, [conversationId, queryClient, user]);

  return query;
};

export const useSendMessage = (conversationId: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => {
      if (!conversationId || !user) throw new Error("Not ready");
      return sendMessage(conversationId, user.id, content);
    },
    onSuccess: (newMsg) => {
      // Optimistic: add to cache immediately
      queryClient.setQueryData<Message[]>(["messages", conversationId], (old) => {
        if (!old) return [newMsg];
        if (old.some((m) => m.id === newMsg.id)) return old;
        return [...old, newMsg];
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};
