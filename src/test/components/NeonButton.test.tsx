import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import NeonButton from "@/components/NeonButton";
import { ArrowRight } from "lucide-react";

describe("NeonButton", () => {
  it("01 renderiza children", () => {
    render(<NeonButton>Continuar</NeonButton>);
    expect(screen.getByRole("button", { name: /continuar/i })).toBeInTheDocument();
  });

  it("02 dispara onClick", () => {
    const fn = vi.fn();
    render(<NeonButton onClick={fn}>OK</NeonButton>);
    fireEvent.click(screen.getByRole("button"));
    expect(fn).toHaveBeenCalledOnce();
  });

  it("03 variant primary tem bg-primary", () => {
    render(<NeonButton>p</NeonButton>);
    expect(screen.getByRole("button").className).toMatch(/bg-primary/);
  });

  it("04 variant outline tem border", () => {
    render(<NeonButton variant="outline">o</NeonButton>);
    expect(screen.getByRole("button").className).toMatch(/border/);
  });

  it("05 variant ghost sem fundo sólido", () => {
    render(<NeonButton variant="ghost">g</NeonButton>);
    expect(screen.getByRole("button").className).not.toMatch(/bg-primary/);
  });

  it("06 size sm tem h-10", () => {
    render(<NeonButton size="sm">s</NeonButton>);
    expect(screen.getByRole("button").className).toMatch(/h-10/);
  });

  it("07 size md/lg tem h-14", () => {
    render(<NeonButton size="lg">l</NeonButton>);
    expect(screen.getByRole("button").className).toMatch(/h-14/);
  });

  it("08 desabilitado não dispara onClick", () => {
    const fn = vi.fn();
    render(<NeonButton onClick={fn} disabled>x</NeonButton>);
    fireEvent.click(screen.getByRole("button"));
    expect(fn).not.toHaveBeenCalled();
  });

  it("09 renderiza ícone à direita por padrão", () => {
    const { container } = render(<NeonButton icon={ArrowRight}>Próximo</NeonButton>);
    expect(container.querySelectorAll("svg").length).toBeGreaterThanOrEqual(1);
  });

  it("10 cumpre tap-target Apple HIG (h-14 = 56px ≥ 44)", () => {
    render(<NeonButton>tap</NeonButton>);
    expect(screen.getByRole("button").className).toMatch(/h-14/);
  });
});
