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
  it("03 renderiza container raiz", () => {
    const { container } = render(<ScreenLayout>x</ScreenLayout>);
    expect(container.firstChild).toBeTruthy();
  });
  it("04 aplica font-display", () => {
    const { container } = render(<ScreenLayout>x</ScreenLayout>);
    expect((container.firstChild as HTMLElement).className).toMatch(/font-display/);
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
