import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FocalPointEditor } from "@/components/media/FocalPointEditor";

describe("FocalPointEditor", () => {
  it("offers publication aspect ratios and a reset action", () => {
    const imageFile = new File(["image"], "item.jpg", { type: "image/jpeg" });

    render(
      <FocalPointEditor
        open
        imageFile={imageFile}
        imageUrl="blob:item"
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "4:5" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "1:1" }));
    expect(screen.getByRole("button", { name: "1:1" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Redefinir" })).toBeInTheDocument();
  });
});
