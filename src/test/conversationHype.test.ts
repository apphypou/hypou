import { describe, expect, it } from "vitest";
import { isNewHype } from "@/lib/conversationHype";

describe("isNewHype", () => {
  it("shows an unopened accepted conversation without messages", () => {
    expect(isNewHype({ match_status: "accepted", last_message: null, hype_opened_at: null })).toBe(true);
  });

  it("removes the highlight after that participant opens the conversation", () => {
    expect(isNewHype({ match_status: "accepted", last_message: null, hype_opened_at: "2026-07-13T20:00:00Z" })).toBe(false);
  });

  it("never highlights completed or cancelled conversations", () => {
    expect(isNewHype({ match_status: "completed", last_message: null })).toBe(false);
    expect(isNewHype({ match_status: "cancelled", last_message: null })).toBe(false);
  });
});
