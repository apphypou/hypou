import { describe, it, expect } from "vitest";

type Direction = "like" | "pass";
const isLike = (d: Direction) => d === "like";

const isReciprocalMatch = (
  swipeA: { swiper: string; item_owner: string; direction: Direction },
  swipeB: { swiper: string; item_owner: string; direction: Direction },
) =>
  swipeA.direction === "like" &&
  swipeB.direction === "like" &&
  swipeA.swiper === swipeB.item_owner &&
  swipeB.swiper === swipeA.item_owner;

const filterOwnItems = <T extends { user_id: string }>(items: T[], userId: string) =>
  items.filter((i) => i.user_id !== userId);

const filterBlocked = <T extends { user_id: string }>(items: T[], blocked: string[]) =>
  items.filter((i) => !blocked.includes(i.user_id));

const marginsOverlap = (a: { value: number; up: number; down: number }, b: { value: number; up: number; down: number }) => {
  const aMin = a.value * (1 - a.down / 100);
  const aMax = a.value * (1 + a.up / 100);
  const bMin = b.value * (1 - b.down / 100);
  const bMax = b.value * (1 + b.up / 100);
  return !(aMax < bMin || bMax < aMin);
};

describe("Swipe: direction", () => {
  it("recognizes like", () => expect(isLike("like")).toBe(true));
  it("recognizes pass", () => expect(isLike("pass")).toBe(false));
});

describe("Match: reciprocity", () => {
  it("detects mutual likes", () => {
    expect(
      isReciprocalMatch(
        { swiper: "A", item_owner: "B", direction: "like" },
        { swiper: "B", item_owner: "A", direction: "like" },
      ),
    ).toBe(true);
  });
  it("rejects when one is pass", () => {
    expect(
      isReciprocalMatch(
        { swiper: "A", item_owner: "B", direction: "like" },
        { swiper: "B", item_owner: "A", direction: "pass" },
      ),
    ).toBe(false);
  });
});

describe("Filter: own and blocked", () => {
  it("removes own items", () => {
    expect(filterOwnItems([{ user_id: "A" }, { user_id: "B" }], "A")).toEqual([{ user_id: "B" }]);
  });
  it("removes blocked users items", () => {
    expect(filterBlocked([{ user_id: "A" }, { user_id: "B" }], ["B"])).toEqual([{ user_id: "A" }]);
  });
});

describe("Compatibility by margin", () => {
  it("matches when ranges overlap", () => {
    expect(marginsOverlap({ value: 10000, up: 15, down: 10 }, { value: 11000, up: 15, down: 10 })).toBe(true);
  });
});
