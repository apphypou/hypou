import { describe, expect, it } from "vitest";

const isVisibleExploreItem = (item: { status: string }) => item.status === "active";
const keepsHistoryStatus = (status: string) => ["deleted", "inactive", "completed"].includes(status);

describe("item soft delete", () => {
  it("hides deleted item from explore but keeps it valid for history", () => {
    expect(isVisibleExploreItem({ status: "deleted" })).toBe(false);
    expect(keepsHistoryStatus("deleted")).toBe(true);
  });
});
