import type { ConversationWithDetails } from "@/services/messageService";

export type ConversationSortInput = {
  created_at?: string | null;
  updated_at?: string | null;
  last_message_at?: string | null;
  last_message?: { created_at?: string | null } | null;
};

const timeValue = (value?: string | null) => {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
};

export const getConversationActivityAt = (conversation: ConversationSortInput) => (
  conversation.last_message_at ||
  conversation.last_message?.created_at ||
  conversation.updated_at ||
  conversation.created_at ||
  ""
);

export const sortConversationsByActivity = <T extends ConversationSortInput>(conversations: T[]) => (
  [...conversations].sort((a, b) => (
    timeValue(getConversationActivityAt(b)) - timeValue(getConversationActivityAt(a))
  ))
);

export const sortConversationsByRecentActivity = sortConversationsByActivity;
