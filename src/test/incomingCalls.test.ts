import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("incoming calls", () => {
  it("keeps a polling fallback when realtime misses a ringing call", () => {
    const source = readSource("src/hooks/useIncomingCalls.ts");

    expect(source).toContain('table: "call_sessions"');
    expect(source).toContain("window.setInterval(loadLatestRinging, 3000)");
    expect(source).toContain("window.clearInterval(pollTimer)");
    expect(source).toContain('.eq("status", "ringing")');
    expect(source).toContain('window.addEventListener("hypou:incoming-call-push", onIncomingCallPush)');
    expect(source).toContain('window.removeEventListener("hypou:incoming-call-push", onIncomingCallPush)');
  });

  it("uses a foreground call push to trigger the immediate server refresh", () => {
    const source = readSource("src/hooks/usePushRegistration.ts");

    expect(source).toContain('data.type === "call" && data.call_session_id');
    expect(source).toContain('new CustomEvent("hypou:incoming-call-push")');
  });

  it("opens the associated conversation for a missed-call notification", () => {
    const source = readSource("src/hooks/usePushRegistration.ts");

    expect(source).toContain('type === "message" || type === "missed_call"');
  });
});
