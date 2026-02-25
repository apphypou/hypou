import { describe, it, expect } from "vitest";

// Test notification type mapping
const iconMap: Record<string, string> = {
  match: "Handshake",
  message: "MessageSquare",
  rating: "Star",
  trade_confirmed: "CheckCircle",
};

describe("Notification types", () => {
  it("should map all known notification types to icons", () => {
    expect(iconMap["match"]).toBe("Handshake");
    expect(iconMap["message"]).toBe("MessageSquare");
    expect(iconMap["rating"]).toBe("Star");
    expect(iconMap["trade_confirmed"]).toBe("CheckCircle");
  });

  it("should return undefined for unknown types", () => {
    expect(iconMap["unknown"]).toBeUndefined();
  });
});

// Test notification filtering
interface Notification {
  id: string;
  read_at: string | null;
  type: string;
}

describe("Notification filtering", () => {
  const notifications: Notification[] = [
    { id: "1", read_at: null, type: "match" },
    { id: "2", read_at: "2024-01-01", type: "message" },
    { id: "3", read_at: null, type: "trade_confirmed" },
  ];

  it("should count unread notifications correctly", () => {
    const unread = notifications.filter((n) => !n.read_at).length;
    expect(unread).toBe(2);
  });

  it("should filter by type", () => {
    const matches = notifications.filter((n) => n.type === "match");
    expect(matches).toHaveLength(1);
  });
});
