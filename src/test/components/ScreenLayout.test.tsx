import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import ScreenLayout from "@/components/ScreenLayout";

describe("ScreenLayout", () => {
  it("01 renderiza children", () => {
    const { getByText } = render(<ScreenLayout><p>oi</p></ScreenLayout>);
    expect(getByText("oi")).toBeInTheDocument();
  });
  it("02 usa h-[100dvh] (dynamic viewport)", () => {
    const { container } = render(<ScreenLayout>x</ScreenLayout>);
    expect((container.firstChild as HTMLElement).className).toMatch(/h-\[100dvh\]/);
  });
  it("03 aplica safe-area top via CSS var", () => {
    const { container } = render(<ScreenLayout>x</ScreenLayout>);
    const el = container.firstChild as HTMLElement;
    // jsdom não computa CSS vars; verifica via getAttribute style raw
    expect(el.getAttribute("style") || "").toMatch(/safe-area-top/);
  });
  it("04 aplica safe-area lateral", () => {
    const { container } = render(<ScreenLayout>x</ScreenLayout>);
    const raw = (container.firstChild as HTMLElement).getAttribute("style") || "";
    expect(raw).toMatch(/safe-area-left/);
    expect(raw).toMatch(/safe-area-right/);
  });
  it("05 tem overflow-hidden para evitar bounce indesejado", () => {
    const { container } = render(<ScreenLayout>x</ScreenLayout>);
    expect((container.firstChild as HTMLElement).className).toMatch(/overflow-hidden/);
  });
  it("06 aceita className adicional", () => {
    const { container } = render(<ScreenLayout className="custom-x">x</ScreenLayout>);
    expect((container.firstChild as HTMLElement).className).toMatch(/custom-x/);
  });
});
