import { fireEvent, screen } from "@testing-library/react";
import { forwardRef, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import Explorar from "@/pages/Explorar";
import { categories } from "@/constants/categories";
import { renderWithProviders } from "./helpers/renderWithProviders";

const item = {
  id: "item-1",
  category: categories[0].label,
  market_value: 100_000,
  item_images: [],
};

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: null }) }));
vi.mock("@/hooks/useRealtimeInvalidate", () => ({ useRealtimeInvalidate: vi.fn() }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock("@/components/ScreenLayout", () => ({ default: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock("@/components/BottomNav", () => ({ default: () => null }));
vi.mock("@/components/SwipeCard", () => ({
  default: forwardRef<HTMLDivElement>((_, ref) => <div ref={ref} />),
}));
vi.mock("@/components/SelectItemDialog", () => ({ default: () => null }));
vi.mock("@/components/GuestPromptDialog", () => ({ default: () => null }));
vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children }: { children: ReactNode }) => <>{children}</>,
  SheetContent: ({ children }: { children: ReactNode }) => <section>{children}</section>,
  SheetHeader: ({ children }: { children: ReactNode }) => <header>{children}</header>,
  SheetTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}));
vi.mock("@/components/ui/slider", () => ({ Slider: () => <div /> }));

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-query")>("@tanstack/react-query");
  return {
    ...actual,
    useQuery: ({ queryKey }: { queryKey: string[] }) => {
      if (queryKey[0] === "explore-items") return { data: [item], isLoading: false };
      return { data: null, isLoading: false, isFetching: false, isError: false };
    },
  };
});

describe("Explore filters", () => {
  it("selects and clears every category with Todos", () => {
    renderWithProviders(<Explorar />);

    fireEvent.click(screen.getByRole("button", { name: "Todos" }));

    for (const category of categories) {
      expect(screen.getByRole("button", { name: new RegExp(category.label) })).toHaveAttribute("aria-pressed", "true");
    }

    fireEvent.click(screen.getByRole("button", { name: "Todos" }));

    for (const category of categories) {
      expect(screen.getByRole("button", { name: new RegExp(category.label) })).toHaveAttribute("aria-pressed", "false");
    }
  });
});
