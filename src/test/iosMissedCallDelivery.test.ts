import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("iOS missed-call delivery", () => {
  it("forwards native APNs registration to Capacitor", () => {
    const source = read("ios/App/App/AppDelegate.swift");
    expect(source).toContain("didRegisterForRemoteNotificationsWithDeviceToken");
    expect(source).toContain(".capacitorDidRegisterForRemoteNotifications");
    expect(source).toContain("didFailToRegisterForRemoteNotificationsWithError");
  });

  it("marks a caller hangup before connection as missed", () => {
    const source = read("src/pages/Chamada.tsx");
    expect(source).toContain("const unanswered = state!.isCaller");
    expect(source).toContain("unanswered ? markMissed");
  });

  it("records inactive recipients as missed and notifies once", () => {
    const edge = read("supabase/functions/livekit-token/index.ts");
    const migration = read("supabase/migrations/20260730100000_fix_ios_missed_call_delivery.sql");
    expect(edge).toContain('status: calleeIsActive ? "ringing" : "missed"');
    expect(edge).toContain('error: "Usuário indisponível"');
    expect(edge).toContain("!presence ||");
    expect(migration).toContain("create table if not exists public.user_app_presence");
    expect(migration).toContain("after insert or update on public.call_sessions");
    expect(migration).toContain("' ligou para você.'");
  });
});
