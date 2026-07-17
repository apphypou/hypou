import { describe, expect, it } from "vitest";
import { shouldShowInMainConversationList } from "@/lib/conversationArchive";

describe("shouldShowInMainConversationList", () => {
  it("hides archived conversations from the main list", () => {
    expect(
      shouldShowInMainConversationList(
        { id: "c1", unread_count: 0, last_message: { sender_id: "me" } as any },
        new Set(["c1"]),
        "me",
      ),
    ).toBe(false);
  });

  it("returns archived conversations to the main list when a new incoming message is unread", () => {
    expect(
      shouldShowInMainConversationList(
        { id: "c1", unread_count: 2, last_message: { sender_id: "them" } as any },
        new Set(["c1"]),
        "me",
      ),
    ).toBe(true);
  });
});
