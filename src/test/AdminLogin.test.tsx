import { beforeEach, describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router-dom";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/helpers/renderWithProviders";
import AdminLogin from "@/pages/admin/AdminLogin";

const { signIn, signOut, getUser, maybeSingle } = vi.hoisted(() => ({
  signIn: vi.fn(), signOut: vi.fn(), getUser: vi.fn(), maybeSingle: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ signIn, signOut }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getUser },
    from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle }) }) }) }),
  },
}));

describe("AdminLogin", () => {
  beforeEach(() => {
    signIn.mockReset(); signOut.mockReset(); getUser.mockReset(); maybeSingle.mockReset();
  });

  it("only sends verified administrators to the panel", async () => {
    signIn.mockResolvedValue({ error: null });
    getUser.mockResolvedValue({ data: { user: { id: "admin-id" } } });
    maybeSingle.mockResolvedValue({ data: { role: "admin" }, error: null });

    renderWithProviders(
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<div>Painel</div>} />
      </Routes>,
      { route: "/admin/login" },
    );

    fireEvent.change(screen.getByRole("textbox", { name: "E-mail administrativo" }), { target: { value: "admin@hypou.app" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "senha-segura" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar no painel" }));

    await waitFor(() => expect(screen.getByText("Painel")).toBeInTheDocument());
    expect(signIn).toHaveBeenCalledWith("admin@hypou.app", "senha-segura");
  });
});
