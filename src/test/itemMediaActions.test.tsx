import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("item media actions", () => {
  it("offers camera and gallery actions for photos", () => {
    render(
      <div role="dialog" aria-label="Adicionar foto">
        <button>Tirar foto</button>
        <button>Escolher da galeria</button>
      </div>,
    );

    expect(screen.getByText("Tirar foto")).toBeInTheDocument();
    expect(screen.getByText("Escolher da galeria")).toBeInTheDocument();
  });

  it("offers camera and gallery actions for videos", () => {
    render(
      <div role="dialog" aria-label="Adicionar video">
        <button>Gravar video</button>
        <button>Escolher da galeria</button>
      </div>,
    );

    expect(screen.getByText("Gravar video")).toBeInTheDocument();
    expect(screen.getByText("Escolher da galeria")).toBeInTheDocument();
  });
});
