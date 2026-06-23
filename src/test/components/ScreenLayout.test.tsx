import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, waitFor } from "@testing-library/react";
import ScreenLayout from "@/components/ScreenLayout";

const renderScreen = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

const performPull = (
  element: HTMLElement,
  from = { clientX: 20, clientY: 20 },
  to = { clientX: 24, clientY: 220 },
) => {
  fireEvent.touchStart(element, { touches: [from] });
  fireEvent.touchMove(element, { touches: [to] });
  fireEvent.touchEnd(element);
};

describe("ScreenLayout", () => {
  it("01 renderiza children", () => {
    const { getByText } = renderScreen(<ScreenLayout><p>oi</p></ScreenLayout>);
    expect(getByText("oi")).toBeInTheDocument();
  });
  it("02 usa h-[100dvh] (dynamic viewport)", () => {
    const { container } = renderScreen(<ScreenLayout>x</ScreenLayout>);
    expect((container.firstChild as HTMLElement).className).toMatch(/h-\[100dvh\]/);
  });
  it("03 renderiza container raiz", () => {
    const { container } = renderScreen(<ScreenLayout>x</ScreenLayout>);
    expect(container.firstChild).toBeTruthy();
  });
  it("04 aplica font-display", () => {
    const { container } = renderScreen(<ScreenLayout>x</ScreenLayout>);
    expect((container.firstChild as HTMLElement).className).toMatch(/font-display/);
  });
  it("05 tem overflow-hidden para evitar bounce indesejado", () => {
    const { container } = renderScreen(<ScreenLayout>x</ScreenLayout>);
    expect((container.firstChild as HTMLElement).className).toMatch(/overflow-hidden/);
  });
  it("06 aceita className adicional", () => {
    const { container } = renderScreen(<ScreenLayout className="custom-x">x</ScreenLayout>);
    expect((container.firstChild as HTMLElement).className).toMatch(/custom-x/);
  });

  it("07 atualiza uma vez depois de um gesto vertical acima do limite", async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const { getByTestId } = renderScreen(<ScreenLayout onRefresh={onRefresh}>x</ScreenLayout>);

    performPull(getByTestId("pull-to-refresh-root"));

    await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(1));
  });

  it("08 ignora swipe horizontal", () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const { getByTestId } = renderScreen(<ScreenLayout onRefresh={onRefresh}>x</ScreenLayout>);

    performPull(
      getByTestId("pull-to-refresh-root"),
      { clientX: 20, clientY: 20 },
      { clientX: 220, clientY: 40 },
    );

    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("09 respeita refreshable false", () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const { getByTestId } = renderScreen(
      <ScreenLayout refreshable={false} onRefresh={onRefresh}>x</ScreenLayout>,
    );

    performPull(getByTestId("pull-to-refresh-root"));

    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("10 ignora gestos iniciados em campos", () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const { getByLabelText } = renderScreen(
      <ScreenLayout onRefresh={onRefresh}><input aria-label="valor" /></ScreenLayout>,
    );

    performPull(getByLabelText("valor"));

    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("11 limpa o indicador depois de uma falha", async () => {
    const onRefresh = vi.fn().mockRejectedValue(new Error("network"));
    const { getByTestId } = renderScreen(<ScreenLayout onRefresh={onRefresh}>x</ScreenLayout>);

    performPull(getByTestId("pull-to-refresh-root"));

    await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(1));
    await waitFor(() => {
      expect(getByTestId("pull-to-refresh-indicator")).toHaveAttribute("data-refreshing", "false");
    });
  });
});
