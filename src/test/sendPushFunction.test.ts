import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "supabase/functions/send-push/index.ts"),
  "utf8",
);

describe("send-push delivery contract", () => {
  it("does not report success when FCM is unavailable", () => {
    expect(source).toContain("Push notifications are not configured");
    expect(source).not.toContain('skipped: "FCM not configured"');
  });

  it("does not hide zero-delivery results as success", () => {
    expect(source).toContain('ok: false, sent: 0, reason: "no_device_tokens"');
    expect(source).toContain("ok: sent > 0");
    expect(source).toContain("failures:");
  });

  it("sends iOS notifications directly through APNs as alert pushes", () => {
    expect(source).toContain('t.platform === "ios"');
    expect(source).toContain('https://api.push.apple.com/3/device/${opts.token}');
    expect(source).toContain('APNS_PRIVATE_KEY');
    expect(source).toContain('"apns-topic": opts.bundleId');
    expect(source).toContain('"apns-push-type": "alert"');
    expect(source).toContain('"content-available": 1');
  });

  it("prioritizes incoming calls so an offline recipient gets an audible alert", () => {
    expect(source).toContain('opts.data.type === "call"');
    expect(source).toContain('"interruption-level": "time-sensitive"');
    expect(source).toContain('sound: "default"');
  });
});
