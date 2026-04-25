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
    expect((container.firstChild as HTMLElement).style.paddingTop).toContain("safe-area-top");
  });
  it("04 aplica safe-area lateral", () => {
    const { container } = render(<ScreenLayout>x</ScreenLayout>);
    const el = container.firstChild as HTMLElement;
    expect(el.style.paddingLeft).toContain("safe-area-left");
    expect(el.style.paddingRight).toContain("safe-area-right");
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
