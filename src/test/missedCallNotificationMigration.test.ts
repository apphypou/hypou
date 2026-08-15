import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("missed call notification", () => {
  it("names the caller in the missed-call push", () => {
    const sql = readFileSync(
      join(process.cwd(), "supabase/migrations/20260726120000_missed_call_caller_name.sql"),
      "utf8",
    );

    expect(sql).toContain("_caller_name text");
    expect(sql).toContain("where user_id = new.caller_id");
    expect(sql).toContain("' ligou para você.'");
  });
});
