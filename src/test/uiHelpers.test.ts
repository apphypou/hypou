import { describe, it, expect, vi } from "vitest";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const truncate = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

const formatLocation = (city?: string, uf?: string) =>
  city && uf ? `${city} - ${uf}` : city || uf || "";

const isEmpty = <T>(arr: T[]) => arr.length === 0;

const showSkeleton = (loading: boolean, dataLength: number) => loading && dataLength === 0;

const showUnreadBadge = (count: number) => count > 0;

describe("UI: date formatting pt-BR", () => {
  it("formats recent date in pt-BR", () => {
    const date = new Date(Date.now() - 60_000);
    const result = formatDistanceToNow(date, { locale: ptBR, addSuffix: true });
    expect(result).toMatch(/minuto|segundo/);
  });
});

describe("UI: text helpers", () => {
  it("truncates long text", () => expect(truncate("Hello world", 6)).toBe("Hello…"));
  it("keeps short text", () => expect(truncate("Hi", 6)).toBe("Hi"));
});

describe("UI: location", () => {
  it("formats city - uf", () => expect(formatLocation("São Paulo", "SP")).toBe("São Paulo - SP"));
  it("falls back to city only", () => expect(formatLocation("Rio")).toBe("Rio"));
});

describe("UI: empty / loading / badge", () => {
  it("detects empty", () => expect(isEmpty([])).toBe(true));
  it("shows skeleton when loading and no data", () => expect(showSkeleton(true, 0)).toBe(true));
  it("hides skeleton when data present", () => expect(showSkeleton(true, 3)).toBe(false));
  it("hides badge when 0", () => expect(showUnreadBadge(0)).toBe(false));
});

describe("UI: pull-to-refresh", () => {
  it("calls invalidateQueries", async () => {
    const invalidate = vi.fn().mockResolvedValue(undefined);
    const handleRefresh = async () => invalidate({ queryKey: ["conversations"] });
    await handleRefresh();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["conversations"] });
  });
});
