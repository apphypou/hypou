import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers/renderWithProviders";
import type { AdminStats } from "@/hooks/useAdminStats";
import AdminDashboard from "@/pages/admin/AdminDashboard";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserverMock);

const stats: AdminStats = {
  meta: { periodDays: 30, periodStart: "2026-07-21", periodEnd: "2026-08-20", updatedAt: "2026-08-20", comparison: { signupsDelta: 0, matchesDelta: 0 } },
  kpis: { totalUsers: 49, activeItems: 48, totalMatches: 83, totalMessages: 440, swipesToday: 0, pendingReports: 2, waitlistCount: 5, activationRate: 34.7, completionRate: 50, averageRating: 4.3 },
  validation: {
    acquisition: { signups: 49, attributedUsers: 0, sourceConfigured: false, cpaCents: null },
    activation: { firstItem: 22, firstSearch: 18, firstTrade: 12, activated: 22 },
    engagement: { dau: 4, wau: 16, mau: 31, active90d: 49, interactions: 440, accessFrequency: 2 },
    liquidity: { itemsPublished: 59, tradesOpen: 18, tradesProgressed: 8, completedTrades: 7, progressRate: 44 },
    retention: { d7: null, d30: null, d90: null, configured: false },
    satisfaction: { averageRating: 4.3, ratingsCount: 12, nps: null, npsResponses: 0, npsPromoters: 0 },
    monetization: { configured: false, paidUsers: 0, arpuCents: null, mrrCents: null, ltvCents: null },
  },
  charts: {
    usersByDay: [{ date: "2026-08-19", count: 2 }, { date: "2026-08-20", count: 3 }],
    matchesByDay: [{ date: "2026-08-19", count: 1 }, { date: "2026-08-20", count: 2 }],
    itemsByCategory: [],
    waitlistByDay: [],
    liquidityByCity: [{ name: "São Paulo - SP", value: 12 }],
    acquisitionSources: [],
  },
  activity: [],
};

vi.mock("@/hooks/useAdminStats", () => ({
  useAdminStats: () => ({ data: stats, isLoading: false, error: null }),
}));

describe("AdminDashboard", () => {
  it("renders the executive dashboard only with real metric labels", () => {
    renderWithProviders(<AdminDashboard />);

    expect(screen.getByRole("heading", { name: "Olá, equipe Hypou" })).toBeInTheDocument();
    expect(screen.getByText("Usuários ativos")).toBeInTheDocument();
    expect(screen.getByText("Trocas em andamento")).toBeInTheDocument();
    expect(screen.getByText("Liquidez por cidade")).toBeInTheDocument();
    expect(screen.getByText("Relatos aguardando análise")).toBeInTheDocument();
  });
});
