type PreviewMessage = {
  conversation_id: string;
  message_type: string;
};

export const getLatestNonSystemMessagesByConversation = <T extends PreviewMessage>(messages: T[]) => {
  const latestMessages: Record<string, T> = {};

  for (const msg of messages) {
    if (msg.message_type === "system") continue;
    if (!latestMessages[msg.conversation_id]) {
      latestMessages[msg.conversation_id] = msg;
    }
  }

  return latestMessages;
};
