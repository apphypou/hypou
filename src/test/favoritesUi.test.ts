import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("saved items UI", () => {
  it("lets users save explore cards and open saved items from their profile", () => {
    const explore = readSource("src/pages/Explorar.tsx");
    const profile = readSource("src/pages/MeuPerfil.tsx");

    expect(explore).toContain("getFavoriteItemIds");
    expect(explore).toContain("handleToggleFavorite");
    expect(explore).toContain('aria-label={favoriteItemIdSet.has(currentItem.id) ? "Remover dos itens salvos" : "Salvar item"}');
    expect(explore).toContain('queryClient.invalidateQueries({ queryKey: ["my-favorites", user.id] })');
    expect(profile).toContain("Itens Salvos");
    expect(profile).toContain("onClick={() => setShowFavorites(true)}");
    expect(profile).toContain('onClick={() => navigate("/explorar", { state: { focusedItem: item } })}');
  });
});
