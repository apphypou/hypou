import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import GuestPromptDialog from "@/components/GuestPromptDialog";
import { renderWithProviders } from "@/test/helpers/renderWithProviders";

const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<any>("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: null }),
}));

describe("GuestPromptDialog", () => {
  beforeEach(() => navigateMock.mockReset());

  it("01 não renderiza quando fechado", () => {
    renderWithProviders(<GuestPromptDialog open={false} onClose={() => {}} />);
    expect(screen.queryByText(/Crie sua conta para trocar/i)).not.toBeInTheDocument();
  });

  it("02 renderiza título quando aberto", () => {
    renderWithProviders(<GuestPromptDialog open onClose={() => {}} />);
    expect(screen.getByText(/Crie sua conta para trocar/i)).toBeInTheDocument();
  });

  it("03 mostra dois CTAs (criar conta e login)", () => {
    renderWithProviders(<GuestPromptDialog open onClose={() => {}} />);
    expect(screen.getByText(/Criar conta grátis/i)).toBeInTheDocument();
    expect(screen.getByText(/Já tenho conta/i)).toBeInTheDocument();
  });

  it("04 botão criar conta navega para /cadastro", () => {
    renderWithProviders(<GuestPromptDialog open onClose={() => {}} />);
    fireEvent.click(screen.getByText(/Criar conta grátis/i));
    expect(navigateMock).toHaveBeenCalledWith("/cadastro");
  });

  it("05 botão entrar navega para /login", () => {
    renderWithProviders(<GuestPromptDialog open onClose={() => {}} />);
    fireEvent.click(screen.getByText(/Já tenho conta/i));
    expect(navigateMock).toHaveBeenCalledWith("/login");
  });
});
