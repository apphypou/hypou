import { describe, expect, it } from "vitest";
import { getMessageDeliveryLabel, getMessageDeliveryStatus } from "@/lib/messageDeliveryStatus";

describe("message delivery status", () => {
  it("does not show status for incoming messages", () => {
    expect(getMessageDeliveryStatus({ sender_id: "other", read_at: null }, "me")).toBe("none");
  });

  it("shows sent for outgoing unread messages", () => {
    const status = getMessageDeliveryStatus({ sender_id: "me", read_at: null }, "me");
    expect(status).toBe("sent");
    expect(getMessageDeliveryLabel(status)).toBe("Enviada");
  });

  it("shows sending and failed for optimistic messages", () => {
    expect(getMessageDeliveryStatus({ sender_id: "me", read_at: null, local_status: "sending" }, "me")).toBe("sending");
    expect(getMessageDeliveryStatus({ sender_id: "me", read_at: null, failed: true }, "me")).toBe("failed");
    expect(getMessageDeliveryLabel("sending")).toBe("Enviando");
    expect(getMessageDeliveryLabel("failed")).toBe("Falhou");
  });

  it("shows read for outgoing read messages", () => {
    const status = getMessageDeliveryStatus({ sender_id: "me", read_at: "2026-06-21T10:00:00Z" }, "me");
    expect(status).toBe("read");
    expect(getMessageDeliveryLabel(status)).toBe("Lida");
  });

  it("shows delivered when the message has a delivered timestamp", () => {
    const status = getMessageDeliveryStatus(
      { sender_id: "me", read_at: null, delivered_at: "2026-06-21T10:00:00Z" },
      "me",
    );

    expect(status).toBe("delivered");
    expect(getMessageDeliveryLabel(status)).toBe("Entregue");
  });
});
