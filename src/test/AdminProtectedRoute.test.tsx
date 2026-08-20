import { describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router-dom";
import { renderWithProviders } from "@/test/helpers/renderWithProviders";
import AdminProtectedRoute from "@/components/admin/AdminProtectedRoute";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

describe("AdminProtectedRoute", () => {
  it("sends signed-out visitors to login while preserving the admin destination", () => {
    const { getByText } = renderWithProviders(
      <Routes>
        <Route path="/admin" element={<AdminProtectedRoute><div>Admin</div></AdminProtectedRoute>} />
        <Route path="/admin/login" element={<div>Login administrativo</div>} />
      </Routes>,
      { route: "/admin" },
    );

    expect(getByText("Login administrativo")).toBeInTheDocument();
  });
});
