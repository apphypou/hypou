import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import GlassCard from "@/components/GlassCard";

describe("GlassCard", () => {
  it("01 renderiza children", () => {
    render(<GlassCard><p>conteúdo</p></GlassCard>);
    expect(screen.getByText("conteúdo")).toBeInTheDocument();
  });

  it("02 aplica classe glass-card base", () => {
    const { container } = render(<GlassCard>x</GlassCard>);
    expect(container.firstChild).toHaveClass("glass-card");
  });

  it("03 hoverable adiciona estado hover", () => {
    const { container } = render(<GlassCard hoverable>x</GlassCard>);
    expect((container.firstChild as HTMLElement).className).toMatch(/hover:/);
  });

  it("04 aceita onClick", () => {
    const fn = vi.fn();
    render(<GlassCard onClick={fn}>clicar</GlassCard>);
    fireEvent.click(screen.getByText("clicar"));
    expect(fn).toHaveBeenCalled();
  });

  it("05 mantém border-radius 2rem", () => {
    const { container } = render(<GlassCard>x</GlassCard>);
    expect((container.firstChild as HTMLElement).className).toMatch(/rounded-\[2rem\]/);
  });
});
