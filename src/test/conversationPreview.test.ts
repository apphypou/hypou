import { describe, expect, it } from "vitest";
import { getLatestNonSystemMessagesByConversation } from "@/lib/conversationPreview";

const message = (overrides: Partial<{
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: "text" | "system";
  media_url: string | null;
  read_at: string | null;
  created_at: string;
}> = {}) => ({
  id: "m1",
  conversation_id: "c1",
  sender_id: "u1",
  content: "Oi",
  message_type: "text" as const,
  media_url: null,
  read_at: null,
  created_at: "2026-06-09T20:00:00Z",
  ...overrides,
});

describe("conversation preview", () => {
  it("usa a mensagem real anterior quando a ultima mensagem e do sistema", () => {
    const latestByConversation = getLatestNonSystemMessagesByConversation([
      message({
        id: "system-latest",
        content: "Você confirmou a troca",
        message_type: "system",
        created_at: "2026-06-09T20:02:00Z",
      }),
      message({
        id: "text-before-system",
        content: "Vamos combinar",
        message_type: "text",
        created_at: "2026-06-09T20:01:00Z",
      }),
    ]);

    expect(latestByConversation.c1?.id).toBe("text-before-system");
  });

  it("deixa sem preview quando a conversa so tem mensagem do sistema", () => {
    const latestByConversation = getLatestNonSystemMessagesByConversation([
      message({
        id: "only-system",
        message_type: "system",
      }),
    ]);

    expect(latestByConversation.c1).toBeUndefined();
  });
});
