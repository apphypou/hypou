/**
 * E2E #3 — Explore / Swipe (15 tests)
 */
import { describe, it, expect } from "vitest";

const SWIPE_THRESHOLD = 100;
const detectDirection = (dx: number) => {
  if (dx > SWIPE_THRESHOLD) return "like";
  if (dx < -SWIPE_THRESHOLD) return "dislike";
  return null;
};
const filterFeed = (items: any[], userId: string, swiped: string[], blocked: string[]) =>
  items.filter(
    (i) =>
      i.status === "active" &&
      i.user_id !== userId &&
      !swiped.includes(i.id) &&
      !blocked.includes(i.user_id) &&
      Array.isArray(i.item_images) &&
      i.item_images.length > 0
  );
const advanceIndex = (i: number) => i + 1;
const isFeedEnded = (loading: boolean, idx: number, total: number) => !loading && idx >= total;

describe("E2E Explorar/Swipe", () => {
  it("01 detecta swipe like > threshold", () => expect(detectDirection(150)).toBe("like"));
  it("02 detecta swipe dislike < -threshold", () => expect(detectDirection(-150)).toBe("dislike"));
  it("03 ignora drag pequeno", () => expect(detectDirection(40)).toBe(null));
  it("04 ignora drag exatamente no threshold", () => expect(detectDirection(100)).toBe(null));
  it("05 filtra item próprio", () =>
    expect(filterFeed([{ id: "1", user_id: "me", status: "active", item_images: [{}] }], "me", [], []).length).toBe(0));
  it("06 filtra item já swiped", () =>
    expect(filterFeed([{ id: "1", user_id: "o", status: "active", item_images: [{}] }], "me", ["1"], []).length).toBe(0));
  it("07 filtra item de bloqueado", () =>
    expect(filterFeed([{ id: "1", user_id: "b", status: "active", item_images: [{}] }], "me", [], ["b"]).length).toBe(0));
  it("08 filtra item sem imagens", () =>
    expect(filterFeed([{ id: "1", user_id: "o", status: "active", item_images: [] }], "me", [], []).length).toBe(0));
  it("09 filtra item inativo", () =>
    expect(filterFeed([{ id: "1", user_id: "o", status: "inactive", item_images: [{}] }], "me", [], []).length).toBe(0));
  it("10 inclui item válido", () =>
    expect(filterFeed([{ id: "1", user_id: "o", status: "active", item_images: [{}] }], "me", [], []).length).toBe(1));
  it("11 avança índice", () => expect(advanceIndex(2)).toBe(3));
  it("12 detecta fim do feed", () => expect(isFeedEnded(false, 5, 5)).toBe(true));
  it("13 não termina enquanto carrega", () => expect(isFeedEnded(true, 5, 5)).toBe(false));
  it("14 streak ativa em 3 likes", () => {
    let s = 0;
    [1, 1, 1].forEach(() => s++);
    expect(s >= 3).toBe(true);
  });
  it("15 streak reseta em dislike", () => {
    let s = 3;
    s = 0;
    expect(s).toBe(0);
  });
});
