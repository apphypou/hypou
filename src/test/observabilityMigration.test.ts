import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260815213000_add_observability_events.sql"),
  "utf8",
);

describe("observability migration", () => {
  it("keeps diagnostics private while allowing authenticated client inserts", () => {
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.observability_events");
    expect(migration).toContain("ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("source = 'client' AND user_id = auth.uid()");
    expect(migration).toContain("Admins can view observability events");
  });

  it("adds the indexes needed to investigate by trace and recent errors", () => {
    expect(migration).toContain("observability_events_trace_id_idx");
    expect(migration).toContain("observability_events_error_idx");
  });
});
