import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { act, fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "./helpers/renderWithProviders";
import Chat from "@/pages/Chat";

const navigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigate };
});

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "me" } }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/components/ScreenLayout", () => ({
  default: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));

vi.mock("@/components/BottomNav", () => ({
  default: () => null,
}));

const conversation = {
  id: "conversation-1",
  unread_count: 0,
  match_status: "completed",
  last_message: {
    content: "Tudo certo",
    created_at: "2026-07-27T03:00:00.000Z",
    sender_id: "other-user",
  },
  other_user: { user_id: "other-user", display_name: "Ana", avatar_url: null },
  other_item: { name: "Bicicleta", image_url: null },
  my_item: { name: "Skate" },
};

vi.mock("@/hooks/useMessages", () => ({
  useConversations: () => ({ data: [conversation], isLoading: false }),
  useArchiveConversation: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useArchiveConversations: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUnarchiveConversation: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

describe("Chat conversation selection", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    navigate.mockReset();
  });

  afterEach(() => vi.useRealTimers());

  it("opens a conversation with a short press", () => {
    renderWithProviders(<Chat />);

    fireEvent.click(screen.getByRole("button", { name: /Abrir conversa com Ana/i }));

    expect(navigate).toHaveBeenCalledWith("/chat/conversation-1");
  });

  it("starts multi-selection after a long press without opening the conversation", () => {
    renderWithProviders(<Chat />);
    const card = screen.getByRole("button", { name: /Abrir conversa com Ana/i });

    fireEvent.pointerDown(card, { pointerType: "touch" });
    act(() => vi.advanceTimersByTime(450));
    fireEvent.pointerUp(card, { pointerType: "touch" });
    fireEvent.click(card);

    expect(navigate).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Arquivar \(1\)/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
  });
});
