import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Teste from "@/pages/Teste";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc },
}));

describe("Cadastro beta", () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it("envia nome e e-mail somente após aceitar o aviso de privacidade", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    render(<BrowserRouter><Teste /></BrowserRouter>);

    fireEvent.change(screen.getByRole("textbox", { name: "Nome" }), { target: { value: "Ana" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Sobrenome" }), { target: { value: "Silva" } });
    fireEvent.change(screen.getByRole("textbox", { name: "E-mail" }), { target: { value: "ana@example.com" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /quero participar/i }));

    await waitFor(() => expect(rpc).toHaveBeenCalledWith("register_beta_tester", {
      p_first_name: "Ana",
      p_last_name: "Silva",
      p_email: "ana@example.com",
      p_privacy_accepted: true,
    }));
    expect(await screen.findByText(/cadastro recebido/i)).toBeInTheDocument();
  });

  it("bloqueia envio sem aceite", () => {
    render(<BrowserRouter><Teste /></BrowserRouter>);
    fireEvent.click(screen.getByRole("button", { name: /quero participar/i }));

    expect(rpc).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/aceite o aviso de privacidade/i);
  });
});
