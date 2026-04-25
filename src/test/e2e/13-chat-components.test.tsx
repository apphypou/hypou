/**
 * E2E #13 — Chat & Match REAL component rendering
 * Validates that the actual UI components render the correct user-facing output
 * across the trade lifecycle (proposal → accepted → completed → rejected).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../helpers/renderWithProviders";
import TradeContextCard from "@/components/TradeContextCard";
import RatingDialog from "@/components/RatingDialog";

// Mock supabase used by RatingDialog
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      insert: () => Promise.resolve({ error: null }),
    }),
  },
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const myItem = {
  name: "Bicicleta",
  item_images: [{ image_url: "https://x/a.jpg", position: 0 }],
};
const otherItem = {
  name: "Skate",
  item_images: [{ image_url: "https://x/b.jpg", position: 0 }],
};

describe("TradeContextCard — real component", () => {
  it("01 renderiza nomes dos dois itens", () => {
    renderWithProviders(<TradeContextCard myItem={myItem} otherItem={otherItem} matchStatus="accepted" />);
    expect(screen.getByText("Bicicleta")).toBeInTheDocument();
    expect(screen.getByText("Skate")).toBeInTheDocument();
  });

  it("02 mostra status 'Em negociação' quando accepted", () => {
    renderWithProviders(<TradeContextCard myItem={myItem} otherItem={otherItem} matchStatus="accepted" />);
    expect(screen.getByText(/Em negociação/i)).toBeInTheDocument();
  });

  it("03 mostra status 'Troca concluída' quando completed", () => {
    renderWithProviders(<TradeContextCard myItem={myItem} otherItem={otherItem} matchStatus="completed" />);
    expect(screen.getByText(/Troca concluída/i)).toBeInTheDocument();
  });

  it("04 mostra status 'Troca não realizada' quando rejected", () => {
    renderWithProviders(<TradeContextCard myItem={myItem} otherItem={otherItem} matchStatus="rejected" />);
    expect(screen.getByText(/Troca não realizada/i)).toBeInTheDocument();
  });

  it("05 mostra 'Pendente' quando proposal", () => {
    renderWithProviders(<TradeContextCard myItem={myItem} otherItem={otherItem} matchStatus="proposal" />);
    expect(screen.getByText(/Pendente/i)).toBeInTheDocument();
  });

  it("06 cai para 'Meu item' se myItem ausente", () => {
    renderWithProviders(<TradeContextCard myItem={null} otherItem={otherItem} matchStatus="accepted" />);
    expect(screen.getByText("Meu item")).toBeInTheDocument();
  });

  it("07 renderiza imagem do meu item", () => {
    const { container } = renderWithProviders(
      <TradeContextCard myItem={myItem} otherItem={otherItem} matchStatus="accepted" />
    );
    const imgs = container.querySelectorAll("img");
    expect(imgs.length).toBe(2);
    expect(imgs[0].getAttribute("src")).toBe("https://x/a.jpg");
  });

  it("08 ordena imagens por position e usa a primeira", () => {
    const item = {
      name: "X",
      item_images: [
        { image_url: "https://x/2.jpg", position: 1 },
        { image_url: "https://x/1.jpg", position: 0 },
      ],
    };
    const { container } = renderWithProviders(
      <TradeContextCard myItem={item} otherItem={otherItem} matchStatus="accepted" />
    );
    expect(container.querySelector("img")?.getAttribute("src")).toBe("https://x/1.jpg");
  });
});

describe("RatingDialog — real component", () => {
  beforeEach(() => vi.clearAllMocks());

  const baseProps = {
    open: true,
    onClose: vi.fn(),
    matchId: "m1",
    raterId: "u1",
    ratedId: "u2",
    ratedName: "Alice",
  };

  it("09 não renderiza quando open=false", () => {
    renderWithProviders(<RatingDialog {...baseProps} open={false} />);
    expect(screen.queryByText(/Avaliar Troca/i)).not.toBeInTheDocument();
  });

  it("10 renderiza título e nome do avaliado", () => {
    renderWithProviders(<RatingDialog {...baseProps} />);
    expect(screen.getByText(/Avaliar Troca/i)).toBeInTheDocument();
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
  });

  it("11 botão Enviar começa desabilitado", () => {
    renderWithProviders(<RatingDialog {...baseProps} />);
    const send = screen.getByRole("button", { name: /Enviar/i });
    expect(send).toBeDisabled();
  });

  it("12 habilita Enviar após selecionar estrela", () => {
    renderWithProviders(<RatingDialog {...baseProps} />);
    const stars = screen.getAllByRole("button").filter((b) => b.querySelector("svg"));
    // Click on the 5th star button
    fireEvent.click(stars[4]);
    expect(screen.getByRole("button", { name: /Enviar/i })).not.toBeDisabled();
  });

  it("13 botão Pular invoca onClose", () => {
    const onClose = vi.fn();
    renderWithProviders(<RatingDialog {...baseProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /Pular/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("14 limita comentário a 300 chars (maxLength)", () => {
    renderWithProviders(<RatingDialog {...baseProps} />);
    const ta = screen.getByPlaceholderText(/Comentário/i) as HTMLTextAreaElement;
    expect(ta.maxLength).toBe(300);
  });

  it("15 envia avaliação ao clicar em Enviar com nota", async () => {
    const onClose = vi.fn();
    renderWithProviders(<RatingDialog {...baseProps} onClose={onClose} />);
    const stars = screen.getAllByRole("button").filter((b) => b.querySelector("svg"));
    fireEvent.click(stars[3]);
    fireEvent.click(screen.getByRole("button", { name: /Enviar/i }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});

describe("Trade flow integration — status labels match service contract", () => {
  const labels: Record<string, RegExp> = {
    proposal: /Pendente/i,
    accepted: /Em negociação/i,
    completed: /Troca concluída/i,
    rejected: /Troca não realizada/i,
  };

  Object.entries(labels).forEach(([status, rx], i) => {
    it(`16.${i + 1} status='${status}' renderiza label correto`, () => {
      renderWithProviders(
        <TradeContextCard myItem={myItem} otherItem={otherItem} matchStatus={status} />
      );
      expect(screen.getByText(rx)).toBeInTheDocument();
    });
  });
});
