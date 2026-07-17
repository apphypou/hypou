export function isNewHype(
  conversation: {
    match_status: string;
    last_message: unknown | null;
    hype_opened_at?: string | null;
  },
) {
  return (
    conversation.match_status === "accepted" &&
    !conversation.last_message &&
    !conversation.hype_opened_at
  );
}
