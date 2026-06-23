import { describe, expect, it } from "vitest";
import { sortConversationsByActivity, sortConversationsByRecentActivity } from "@/lib/conversationOrdering";

const conversation = (id: string, created_at: string, lastMessageAt?: string | null) => ({
  id,
  match_id: `match-${id}`,
  created_at,
  other_user: { user_id: `user-${id}`, display_name: null, avatar_url: null },
  other_item: { name: "Item", market_value: 0, image_url: null },
  my_item: { name: "Meu item" },
  last_message: lastMessageAt
    ? {
        id: `message-${id}`,
        conversation_id: id,
        sender_id: "sender",
        content: "Oi",
        message_type: "text" as const,
        media_url: null,
        read_at: null,
        created_at: lastMessageAt,
      }
    : null,
  unread_count: 0,
  match_status: "accepted",
});

describe("conversation ordering", () => {
  it("sorts by latest visible message first", () => {
    const sorted = sortConversationsByActivity([
      conversation("old", "2026-06-01T10:00:00Z", "2026-06-01T10:05:00Z"),
      conversation("new", "2026-06-01T09:00:00Z", "2026-06-02T10:05:00Z"),
    ]);

    expect(sorted.map((c) => c.id)).toEqual(["new", "old"]);
  });

  it("falls back to conversation creation when there is no message", () => {
    const sorted = sortConversationsByActivity([
      conversation("a", "2026-06-01T10:00:00Z", null),
      conversation("b", "2026-06-03T10:00:00Z", null),
    ]);

    expect(sorted.map((c) => c.id)).toEqual(["b", "a"]);
  });

  it("prioritizes explicit last_message_at for WhatsApp-like ordering", () => {
    const sorted = sortConversationsByRecentActivity([
      { updated_at: "2026-06-20T10:00:00Z" },
      { last_message_at: "2026-06-22T10:00:00Z" },
    ]);

    expect(sorted[0].last_message_at).toBe("2026-06-22T10:00:00Z");
  });
});
