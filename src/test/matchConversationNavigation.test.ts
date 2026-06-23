import { describe, expect, it, vi, beforeEach } from "vitest";
import { makeQueryBuilder, mockSupabaseClient } from "./helpers/mockSupabase";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: mockSupabaseClient,
}));

describe("match conversation navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves an accepted match to its existing conversation id", async () => {
    const query = makeQueryBuilder({ id: "conversation-123" }, null);
    mockSupabaseClient.from.mockReturnValueOnce(query);

    const { getConversationIdForMatch } = await import("@/services/messageService");

    await expect(getConversationIdForMatch("match-123")).resolves.toBe("conversation-123");
    expect(mockSupabaseClient.from).toHaveBeenCalledWith("conversations");
    expect(query.select).toHaveBeenCalledWith("id");
    expect(query.eq).toHaveBeenCalledWith("match_id", "match-123");
    expect(query.maybeSingle).toHaveBeenCalled();
  });

  it("returns null when a match has no conversation yet", async () => {
    mockSupabaseClient.from.mockReturnValueOnce(makeQueryBuilder(null, null));

    const { getConversationIdForMatch } = await import("@/services/messageService");

    await expect(getConversationIdForMatch("match-without-chat")).resolves.toBeNull();
  });
});
