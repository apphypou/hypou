import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import BottomNav from "@/components/BottomNav";
import { renderWithProviders } from "@/test/helpers/renderWithProviders";

vi.mock("@/hooks/useUnreadCount", () => ({
  useUnreadCount: () => 0,
}));

describe("BottomNav", () => {
  it("01 renderiza 4 tabs", () => {
    const { container } = renderWithProviders(<BottomNav activeTab="explorar" />);
    expect(container.querySelectorAll("button").length).toBe(4);
  });

  it("02 nav é fixed e flutuante", () => {
    const { container } = renderWithProviders(<BottomNav activeTab="explorar" />);
    expect((container.firstChild as HTMLElement).className).toMatch(/fixed/);
  });

  it("03 renderiza nav element", () => {
    const { container } = renderWithProviders(<BottomNav activeTab="explorar" />);
    expect(container.querySelector("nav")).toBeTruthy();
  });

  it("04 nav tem backdrop-blur (Liquid Glass)", () => {
    const { container } = renderWithProviders(<BottomNav activeTab="explorar" />);
    const nav = container.querySelector("nav")!;
    expect(nav.className).toMatch(/backdrop-blur/);
  });

  it("05 botões têm h-12 (≥44pt tap target)", () => {
    const { container } = renderWithProviders(<BottomNav activeTab="explorar" />);
    const btns = container.querySelectorAll("button");
    btns.forEach((b) => expect(b.className).toMatch(/h-12/));
  });
});

describe("BottomNav unread", () => {
  it("06 mostra badge numérico quando há mensagens não lidas", async () => {
    vi.resetModules();
    vi.doMock("@/hooks/useUnreadCount", () => ({ useUnreadCount: () => 5 }));
    const { default: BN } = await import("@/components/BottomNav");
    renderWithProviders(<BN activeTab="explorar" />);
    expect(screen.getByLabelText(/5 novas mensagens/i)).toHaveTextContent("5");
  });

  it("07 limita badge a 99+ quando >99", async () => {
    vi.resetModules();
    vi.doMock("@/hooks/useUnreadCount", () => ({ useUnreadCount: () => 150 }));
    const { default: BN } = await import("@/components/BottomNav");
    renderWithProviders(<BN activeTab="explorar" />);
    expect(screen.getByLabelText(/150 novas mensagens/i)).toHaveTextContent("99+");
  });

  it("08 oculta badge quando contagem é 0", async () => {
    vi.resetModules();
    vi.doMock("@/hooks/useUnreadCount", () => ({ useUnreadCount: () => 0 }));
    const { default: BN } = await import("@/components/BottomNav");
    const { container } = renderWithProviders(<BN activeTab="explorar" />);
    expect(container.querySelector("[aria-label*='novas mensagens']")).toBeNull();
  });
});
