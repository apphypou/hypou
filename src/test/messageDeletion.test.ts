import { describe, expect, it } from "vitest";

type Message = {
  content: string;
  media_url: string | null;
  message_type: "text" | "image" | "video" | "audio" | "system";
  deleted_at?: string | null;
};

const visibleMessage = (message: Message) => {
  if (message.deleted_at) {
    return { content: "Mensagem apagada", media_url: null, message_type: "text" };
  }
  return message;
};

describe("message deletion", () => {
  it("hides content and media for deleted messages", () => {
    const result = visibleMessage({
      content: "foto",
      media_url: "https://cdn/image.jpg",
      message_type: "image",
      deleted_at: "2026-06-29T12:00:00.000Z",
    });

    expect(result).toEqual({ content: "Mensagem apagada", media_url: null, message_type: "text" });
  });
});
