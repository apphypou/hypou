import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { getMatches } from "@/services/matchService";
import { getConversations } from "@/services/messageService";
import { useProfile } from "@/hooks/useProfile";
import { useTradeBadgeCount } from "@/hooks/useTradeBadgeCount";

const trace = vi.hoisted(() => ({
  requests: [] as Array<{ table: string; start: number }>,
  slowItems: false,
}));

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "me" } }) }));
vi.mock("@/hooks/useRealtimeInvalidate", () => ({ useRealtimeInvalidate: () => undefined }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => {
      const chain: any = new Proxy({}, {
        get: (_target, property) => property === "then"
          ? (resolve: (value: unknown) => void) => {
              trace.requests.push({ table, start: Date.now() });
              const rows = table === "matches"
                ? [{
                    id: "m1",
                    status: "accepted",
                    user_a_id: "me",
                    user_b_id: "other",
                    conversations: [{ id: "c1", created_at: "2026-01-01" }],
                  }]
                : [];
              const data = table === "profiles"
                ? { user_id: "me", display_name: "Test" }
                : rows;
              setTimeout(
                () => resolve({ data, error: null, count: 0 }),
                trace.slowItems && table === "items" ? 1_000 : 100,
              );
            }
          : () => chain,
      });
      return chain;
    },
  },
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  trace.requests = [];
  trace.slowItems = false;
});

const createWrapper = (client: QueryClient) =>
  ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

describe("critical screen loading", () => {
  it("reuses the fresh trade badge query when the navbar remounts", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    const wrapper = createWrapper(client);

    const first = renderHook(() => useTradeBadgeCount(), { wrapper });
    await act(async () => { await vi.advanceTimersByTimeAsync(350); });
    const initialRequests = trace.requests.length;
    first.unmount();

    const second = renderHook(() => useTradeBadgeCount(), { wrapper });
    await act(async () => { await vi.advanceTimersByTimeAsync(350); });

    expect(trace.requests).toHaveLength(initialRequests);
    second.unmount();
    client.clear();
  });

  it.each([
    ["Trocas", getMatches],
    ["Chat", getConversations],
  ] as const)("loads independent %s dependencies in parallel", async (_name, load) => {
    vi.useFakeTimers();
    vi.setSystemTime(0);

    const result = load("me");
    await vi.advanceTimersByTimeAsync(1_000);
    await result;

    expect(new Set(trace.requests.map((request) => request.start)).size).toBeLessThanOrEqual(2);
  });

  it("shows profile identity without waiting for the item list", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    trace.slowItems = true;
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });

    const { result, unmount } = renderHook(() => useProfile(), { wrapper: createWrapper(client) });
    await act(async () => { await vi.advanceTimersByTimeAsync(350); });

    expect(result.current.profile).toBeTruthy();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isItemsLoading).toBe(true);
    unmount();
    client.clear();
  });
});
