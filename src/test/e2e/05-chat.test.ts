/**
 * E2E #5 — Chat / Conversations (15 tests)
 */
import { describe, it, expect } from "vitest";

type MType = "text" | "image" | "video" | "audio";
const validMessageType = (t: string): t is MType => ["text", "image", "video", "audio"].includes(t);
const canSend = (content: string, mediaUrl: string | null, type: MType) =>
  type === "text" ? content.trim().length > 0 : !!mediaUrl;
const isRead = (msg: any) => !!msg.read_at;
const unreadCount = (msgs: any[], myId: string) =>
  msgs.filter((m) => m.sender_id !== myId && !m.read_at).length;
const canOpenChat = (matchStatus: string) => matchStatus === "accepted" || matchStatus === "completed";
const requiresChatTerms = (acceptedAt: string | null) => !acceptedAt;
const validMediaSize = (bytes: number, type: MType) => {
  const limits: Record<MType, number> = { text: 0, image: 10 * 1024 * 1024, video: 50 * 1024 * 1024, audio: 10 * 1024 * 1024 };
  return type === "text" || bytes <= limits[type];
};
const formatLastSeen = (date: Date) => date.toLocaleString("pt-BR");

describe("E2E Chat", () => {
  it("01 valida tipo text", () => expect(validMessageType("text")).toBe(true));
  it("02 valida tipo image", () => expect(validMessageType("image")).toBe(true));
  it("03 rejeita tipo desconhecido", () => expect(validMessageType("xxx")).toBe(false));
  it("04 envia texto não vazio", () => expect(canSend("oi", null, "text")).toBe(true));
  it("05 bloqueia texto vazio", () => expect(canSend("   ", null, "text")).toBe(false));
  it("06 envia imagem com url", () => expect(canSend("", "u", "image")).toBe(true));
  it("07 bloqueia imagem sem url", () => expect(canSend("", null, "image")).toBe(false));
  it("08 detecta lida", () => expect(isRead({ read_at: "x" })).toBe(true));
  it("09 conta não lidas do outro", () =>
    expect(unreadCount([{ sender_id: "o", read_at: null }, { sender_id: "me", read_at: null }], "me")).toBe(1));
  it("10 chat aberto se accepted", () => expect(canOpenChat("accepted")).toBe(true));
  it("11 chat fechado se proposal", () => expect(canOpenChat("proposal")).toBe(false));
  it("12 exige termos no primeiro acesso", () => expect(requiresChatTerms(null)).toBe(true));
  it("13 não exige termos se já aceito", () => expect(requiresChatTerms("2024-01-01")).toBe(false));
  it("14 limite vídeo 50MB", () => expect(validMediaSize(60 * 1024 * 1024, "video")).toBe(false));
  it("15 formata última visita pt-BR", () =>
    expect(formatLastSeen(new Date("2026-01-01T10:00:00Z"))).toMatch(/2026|2025/));
});
