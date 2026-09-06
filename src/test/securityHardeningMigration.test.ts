import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260905120000_security_hardening.sql"),
  "utf8",
);

describe("security hardening migration", () => {
  it("makes public profiles read-only through an invoker view", () => {
    expect(migration).toContain("WITH (security_invoker = true, security_barrier = true)");
    expect(migration).toContain("REVOKE ALL ON TABLE public.public_profiles FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("GRANT SELECT ON TABLE public.public_profiles TO anon, authenticated");
  });

  it("removes direct writes from server-owned workflows", () => {
    expect(migration).toContain("REVOKE INSERT, DELETE ON TABLE public.matches FROM anon, authenticated");
    expect(migration).toContain("REVOKE INSERT ON TABLE public.call_sessions FROM anon, authenticated");
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.enforce_messages_insert_guard()");
    expect(migration).toContain("NEW.message_type NOT IN ('text', 'image', 'video', 'audio')");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.notify_push(uuid, text, text, jsonb) FROM PUBLIC, anon, authenticated");
    expect(migration).toContain("REVOKE INSERT, UPDATE, DELETE ON TABLE public.user_roles FROM anon, authenticated");
  });

  it("uses participant-scoped private media and an atomic server-only quota", () => {
    expect(migration).toContain("'chat-media-private', 'chat-media-private', false");
    expect(migration).toContain("Participants can read private chat media");
    expect(migration).toContain("pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0))");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.consume_ai_validation_quota(uuid, integer, integer) TO service_role");
  });

  it("requires AAL2 for staff privileges from user sessions", () => {
    expect(migration).toContain("NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'aal'");
  });
});
