import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("ringing call expiry migration", () => {
  it("expires stale calls in the database and notifies the callee once", () => {
    const sql = readFileSync(
      join(process.cwd(), "supabase/migrations/20260713160000_expire_ringing_calls.sql"),
      "utf8",
    );

    expect(sql).toContain("create extension if not exists pg_cron");
    expect(sql).toContain("create or replace function public.expire_ringing_calls()");
    expect(sql).toContain("status = 'ringing'");
    expect(sql).toContain("started_at <= now() - interval '45 seconds'");
    expect(sql).toContain("new.status = 'missed' and old.status is distinct from 'missed'");
    expect(sql).toContain("'type', 'missed_call'");
    expect(sql).toContain("hypou-expire-ringing-calls");
  });
});
