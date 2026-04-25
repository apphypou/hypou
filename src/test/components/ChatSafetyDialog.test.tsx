import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import ChatSafetyDialog from "@/components/ChatSafetyDialog";
import { renderWithProviders } from "@/test/helpers/renderWithProviders";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
    }),
  },
}));

describe("ChatSafetyDialog", () => {
  it("01 mostra título de segurança no step 1", () => {
    renderWithProviders(<ChatSafetyDialog open userId="u1" onAccepted={() => {}} />);
    expect(screen.getByText(/Negocie com segurança/i)).toBeInTheDocument();
  });

  it("02 lista 5 dicas de segurança", () => {
    renderWithProviders(<ChatSafetyDialog open userId="u1" onAccepted={() => {}} />);
    expect(screen.getByText(/dados bancários/i)).toBeInTheDocument();
    expect(screen.getByText(/locais públicos/i)).toBeInTheDocument();
    expect(screen.getByText(/ofertas boas demais/i)).toBeInTheDocument();
    expect(screen.getByText(/avaliações do usuário/i)).toBeInTheDocument();
    expect(screen.getByText(/pagamentos antecipados/i)).toBeInTheDocument();
  });

  it("03 botão Continuar avança para step 2 (termos)", () => {
    renderWithProviders(<ChatSafetyDialog open userId="u1" onAccepted={() => {}} />);
    fireEvent.click(screen.getByText(/Continuar/));
    expect(screen.getByText(/Termos de Uso do Chat/i)).toBeInTheDocument();
  });

  it("04 botão Aceitar inicialmente desabilitado", () => {
    renderWithProviders(<ChatSafetyDialog open userId="u1" onAccepted={() => {}} />);
    fireEvent.click(screen.getByText(/Continuar/));
    const btn = screen.getByText(/Aceitar e Continuar/i).closest("button")!;
    expect(btn).toBeDisabled();
  });
});
