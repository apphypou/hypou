import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MediaViewerDialog from "@/components/MediaViewerDialog";

describe("MediaViewerDialog", () => {
  it("opens the image viewer and closes it through its visible control", () => {
    const onOpenChange = vi.fn();

    render(
      <MediaViewerDialog
        media={{ url: "https://example.com/item.jpg", alt: "Item salvo" }}
        onOpenChange={onOpenChange}
      />,
    );

    expect(screen.getByRole("dialog")).toBeVisible();
    expect(screen.getByRole("img", { name: "Item salvo" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Fechar mídia" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
