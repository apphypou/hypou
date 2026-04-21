import { describe, it, expect } from "vitest";

type Status = "accepted" | "completed" | "rejected" | "proposal";

const tradeStatusLabel = (s: Status): string | null => {
  if (s === "accepted") return "Em negociação";
  if (s === "completed") return "Troca concluída";
  if (s === "rejected") return "Troca não realizada";
  return null;
};

const computeFinalStatus = (a: boolean, b: boolean, status: Status): Status =>
  a && b && status === "accepted" ? "completed" : status;

const sideToField = (side: "a" | "b") => (side === "a" ? "confirmed_by_a" : "confirmed_by_b");

const isValidMessage = (content: string) => content.trim().length > 0;

const validMediaTypes = ["text", "image", "video", "audio"];
const isValidMediaType = (t: string) => validMediaTypes.includes(t);

const itemStatusAfterCompletion = (matchStatus: Status) =>
  matchStatus === "completed" ? "inactive" : "active";

describe("Chat: trade status labels", () => {
  it("accepted -> Em negociação", () => expect(tradeStatusLabel("accepted")).toBe("Em negociação"));
  it("completed -> Troca concluída", () => expect(tradeStatusLabel("completed")).toBe("Troca concluída"));
  it("rejected -> Troca não realizada", () => expect(tradeStatusLabel("rejected")).toBe("Troca não realizada"));
});

describe("Trade: double confirmation", () => {
  it("both -> completed", () => expect(computeFinalStatus(true, true, "accepted")).toBe("completed"));
  it("partial keeps accepted", () => expect(computeFinalStatus(true, false, "accepted")).toBe("accepted"));
});

describe("Trade: side mapping", () => {
  it("side a", () => expect(sideToField("a")).toBe("confirmed_by_a"));
  it("side b", () => expect(sideToField("b")).toBe("confirmed_by_b"));
});

describe("Chat: message and media", () => {
  it("rejects empty message", () => expect(isValidMessage("   ")).toBe(false));
  it("accepts media types", () => {
    expect(isValidMediaType("image")).toBe(true);
    expect(isValidMediaType("pdf")).toBe(false);
  });
});

describe("Trade: item deactivation trigger", () => {
  it("deactivates when completed", () => expect(itemStatusAfterCompletion("completed")).toBe("inactive"));
  it("keeps active otherwise", () => expect(itemStatusAfterCompletion("accepted")).toBe("active"));
});
