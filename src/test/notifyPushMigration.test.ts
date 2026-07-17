import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("notify_push migration", () => {
  it("keeps the Bearer header required by send-push", () => {
    const sql = readFileSync(
      join(process.cwd(), "supabase/migrations/20260701184500_restore_notify_push_auth.sql"),
      "utf8",
    );

    expect(sql).toContain("push_hook_secret");
    expect(sql).toContain("'Authorization'");
    expect(sql).toContain("'Bearer ' || _key");
  });
});
