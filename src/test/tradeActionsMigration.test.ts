import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("trade actions migration", () => {
  const sql = readFileSync(
    join(process.cwd(), "supabase/migrations/20260714090000_trade_actions_and_blocked_calls.sql"),
    "utf8",
  );

  it("moves accept, reject, confirmation and cancellation to atomic RPCs", () => {
    expect(sql).toContain("FUNCTION public.accept_match(p_match_id uuid)");
    expect(sql).toContain("FUNCTION public.reject_match(p_match_id uuid)");
    expect(sql).toContain("FUNCTION public.confirm_trade_delivery(p_match_id uuid)");
    expect(sql).toContain("FUNCTION public.cancel_match(p_match_id uuid)");
    expect(sql).toContain("FOR UPDATE");
  });

  it("preserves the cancellation audit trail and tells the other participant", () => {
    expect(sql).toContain("cancelled_at = now()");
    expect(sql).toContain("Negociação cancelada por um participante antes da entrega.");
    expect(sql).toContain("'trade_cancelled'");
  });

  it("prevents direct calls in blocked conversations", () => {
    expect(sql).toContain('DROP POLICY IF EXISTS "Caller can insert calls"');
    expect(sql).toContain("NOT public.is_conversation_blocked(conversation_id)");
  });
});
