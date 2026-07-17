import type { ConversationWithDetails } from "@/services/messageService";

export function shouldShowInMainConversationList(
  conversation: Pick<ConversationWithDetails, "id" | "unread_count" | "last_message">,
  archivedIds: Set<string>,
  currentUserId: string,
) {
  if (!archivedIds.has(conversation.id)) return true;

  return (
    conversation.unread_count > 0 &&
    conversation.last_message?.sender_id !== currentUserId
  );
}
