import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HypouLogo from "@/components/HypouLogo";

describe("HypouLogo", () => {
  it("01 renderiza marca completa hypou", () => {
    render(<HypouLogo />);
    expect(screen.getByText("hyp")).toBeInTheDocument();
    expect(screen.getByText("ou")).toBeInTheDocument();
  });

  it("02 size sm aplica text-xl", () => {
    const { container } = render(<HypouLogo size="sm" />);
    expect(container.firstChild).toHaveClass("text-xl");
  });

  it("03 size md aplica text-2xl (default)", () => {
    const { container } = render(<HypouLogo />);
    expect(container.firstChild).toHaveClass("text-2xl");
  });

  it("04 size lg aplica text-4xl", () => {
    const { container } = render(<HypouLogo size="lg" />);
    expect(container.firstChild).toHaveClass("text-4xl");
  });

  it("05 aceita className adicional", () => {
    const { container } = render(<HypouLogo className="opacity-50" />);
    expect(container.firstChild).toHaveClass("opacity-50");
  });

  it("06 'ou' usa cor primary com glow", () => {
    render(<HypouLogo />);
    const ou = screen.getByText("ou");
    expect(ou.className).toMatch(/text-primary/);
    expect(ou.className).toMatch(/text-glow/);
  });

  it("07 'hyp' usa cor foreground", () => {
    render(<HypouLogo />);
    expect(screen.getByText("hyp").className).toMatch(/text-foreground/);
  });
});
