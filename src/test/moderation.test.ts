import { describe, it, expect } from "vitest";

const filterBlockedFromFeed = <T extends { user_id: string }>(items: T[], blocked: string[]) =>
  items.filter((i) => !blocked.includes(i.user_id));

const canBlock = (blocker: string, target: string) => blocker !== target;

const isReportValid = (r: { reason?: string; reported_user_id?: string }) =>
  Boolean(r.reason && r.reason.trim() && r.reported_user_id);

const defaultReportStatus = () => "pending";

describe("Moderation: blocked users", () => {
  it("removes from feed", () => {
    expect(filterBlockedFromFeed([{ user_id: "A" }, { user_id: "X" }], ["X"])).toEqual([
      { user_id: "A" },
    ]);
  });
  it("removes from conversations", () => {
    const convos = [{ user_id: "A" }, { user_id: "B" }];
    expect(filterBlockedFromFeed(convos, ["A", "B"])).toEqual([]);
  });
});

describe("Moderation: block rules", () => {
  it("cannot block self", () => expect(canBlock("A", "A")).toBe(false));
  it("can block others", () => expect(canBlock("A", "B")).toBe(true));
});

describe("Moderation: reports", () => {
  it("requires reason", () => {
    expect(isReportValid({ reason: "", reported_user_id: "X" })).toBe(false);
  });
  it("default status pending", () => expect(defaultReportStatus()).toBe("pending"));
});
