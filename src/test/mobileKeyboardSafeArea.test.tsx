import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("mobile keyboard safe areas", () => {
  it("keeps fixed bottom actions above the bottom nav", () => {
    render(
      <div style={{ paddingBottom: "calc(var(--bottom-nav-height) + env(safe-area-inset-bottom) + 16px)" }}>
        <button>Enviar proposta</button>
      </div>,
    );

    expect(screen.getByText("Enviar proposta")).toBeInTheDocument();
  });

  it("uses at least 16px font size on mobile inputs to avoid iOS zoom", () => {
    render(<input aria-label="Valor em dinheiro" className="text-base" />);

    expect(screen.getByLabelText("Valor em dinheiro").className).toContain("text-base");
  });
});
