import { describe, expect, it, vi } from "vitest";

const getBlockedUserIds = vi.fn();
const rpc = vi.fn();

const query = {
  select: vi.fn(),
  eq: vi.fn(),
  neq: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
};
query.select.mockReturnValue(query);
query.eq.mockReturnValue(query);
query.neq.mockReturnValue(query);
query.order.mockReturnValue(query);
query.limit.mockReturnValue(query);
(query as any).then = (resolve: (value: { data: unknown[]; error: null }) => unknown) =>
  Promise.resolve({ data: [], error: null }).then(resolve);

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: vi.fn(() => query), rpc },
}));

vi.mock("@/services/reportService", () => ({ getBlockedUserIds }));

describe("recommended item loading", () => {
  it("starts the recommendation request without waiting for blocked users", async () => {
    let resolveBlockedUsers!: (value: string[]) => void;
    getBlockedUserIds.mockReturnValue(new Promise<string[]>((resolve) => {
      resolveBlockedUsers = resolve;
    }));
    rpc.mockResolvedValue({ data: [], error: null });

    const { getRecommendedItems } = await import("@/services/itemService");
    const result = getRecommendedItems("user-1", 1);

    expect(rpc).toHaveBeenCalledWith("recommended_items", { p_user_id: "user-1", p_limit: 1 });

    resolveBlockedUsers([]);
    await expect(result).resolves.toEqual([]);
  });
});
