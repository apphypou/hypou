import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AuthSocialButtons from "@/components/auth/AuthSocialButtons";

describe("AuthSocialButtons", () => {
  it("keeps visible progress while Google login is being completed", () => {
    render(
      <AuthSocialButtons
        loadingProvider="google"
        mode="login"
        onProvider={vi.fn()}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Concluindo login com Google");
    expect(screen.getByRole("button", { name: "Entrar com Google..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Entrar com Apple" })).toBeDisabled();
  });
});
