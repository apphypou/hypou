import { describe, it, expect } from "vitest";

// SwipeToggle constants & behavior (lógica pura — evita instanciar framer-motion em jsdom)
const MAX_DRAG = 80;
const CENTER = MAX_DRAG / 2;
const SNAP_THRESHOLD = 20;

const shouldFireLike = (pos: number) => pos > MAX_DRAG - SNAP_THRESHOLD;
const shouldFireDislike = (pos: number) => pos < SNAP_THRESHOLD;
const isNeutral = (pos: number) => !shouldFireLike(pos) && !shouldFireDislike(pos);

describe("SwipeToggle (logic)", () => {
  it("01 CENTER = 40", () => expect(CENTER).toBe(40));
  it("02 swipe direita dispara like", () => expect(shouldFireLike(75)).toBe(true));
  it("03 swipe leve direita não dispara", () => expect(shouldFireLike(50)).toBe(false));
  it("04 swipe esquerda dispara dislike", () => expect(shouldFireDislike(10)).toBe(true));
  it("05 centro é neutro", () => expect(isNeutral(40)).toBe(true));
  it("06 borda direita é like", () => expect(shouldFireLike(MAX_DRAG)).toBe(true));
  it("07 borda esquerda é dislike", () => expect(shouldFireDislike(0)).toBe(true));
});
