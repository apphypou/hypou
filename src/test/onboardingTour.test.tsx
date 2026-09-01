import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import OnboardingTour from "@/components/OnboardingTour";

const { getProfile, updateProfile } = vi.hoisted(() => ({
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
}));

vi.mock("@/services/profileService", () => ({ getProfile, updateProfile }));

afterEach(() => {
  cleanup();
});

describe("OnboardingTour", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("avança pelas três etapas e registra a confirmação no perfil", async () => {
    getProfile.mockResolvedValue({ product_tour_completed_at: null });
    updateProfile.mockResolvedValue({});
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { rerender } = render(
      <QueryClientProvider client={queryClient}><OnboardingTour userId="user-1" /></QueryClientProvider>,
    );

    expect(await screen.findByRole("heading", { name: /explore novas possibilidades/i })).toBeInTheDocument();
    expect(screen.getByText("1 de 3")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(await screen.findByRole("heading", { name: /dê hypou no que interessa/i })).toBeInTheDocument();
    expect(screen.getByText("2 de 3")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(await screen.findByRole("heading", { name: /sua troca começa aqui/i })).toBeInTheDocument();
    expect(screen.getByText("3 de 3")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Começar a explorar" }));
    await waitFor(() => expect(updateProfile).toHaveBeenCalledWith("user-1", {
      product_tour_completed_at: expect.any(String),
    }));
    expect(screen.queryByRole("heading", { name: /explore novas possibilidades/i })).not.toBeInTheDocument();

    getProfile.mockResolvedValue({ product_tour_completed_at: "2026-08-28T00:00:00.000Z" });
    rerender(<QueryClientProvider client={queryClient}><OnboardingTour userId="user-2" /></QueryClientProvider>);
    await waitFor(() => expect(getProfile).toHaveBeenCalledWith("user-2"));
    expect(screen.queryByRole("heading", { name: /explore novas possibilidades/i })).not.toBeInTheDocument();
  });
});
