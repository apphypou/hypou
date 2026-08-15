import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const profileSource = readFileSync(resolve(process.cwd(), "src/pages/MeuPerfil.tsx"), "utf8");
const exploreSource = readFileSync(resolve(process.cwd(), "src/pages/Explorar.tsx"), "utf8");

describe("saved item navigation", () => {
  it("opens the saved item as the first Explore card", () => {
    expect(profileSource).toContain('navigate("/explorar", { state: { focusedItem: item } })');
    expect(profileSource).not.toContain('navigate(`/item/${item.id}`)');
    expect(exploreSource).toContain("[focusedItem, ...feedItems.filter");
  });
});
