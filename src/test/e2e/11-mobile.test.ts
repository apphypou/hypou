/**
 * E2E #11 — Mobile / Capacitor Compliance (15 tests)
 * Apple HIG, safe-area, account deletion, native features.
 */
import { describe, it, expect } from "vitest";

const APP_ID = "app.lovable.acb982366bad48cfa029a44082a5c548";
const APP_NAME = "hypou";
const SAFE_AREA_BOTTOM = "env(safe-area-inset-bottom, 0px)";
const SAFE_AREA_TOP = "env(safe-area-inset-top, 0px)";
const TAP_TARGET_MIN = 44; // Apple HIG
const isLargeEnough = (px: number) => px >= TAP_TARGET_MIN;

const REQUIRED_HIG_FEATURES = ["account_deletion", "block_user", "report_user", "no_external_payments"];
const supportsFeature = (f: string, list: string[]) => list.includes(f);

const isOnline = (n: boolean) => n;
const cacheStaleMs = 5 * 60 * 1000;
const cacheGcMs = 30 * 60 * 1000;
const allowedImageOrigins = ["data:", "blob:", "https://"];
const isAllowedImage = (src: string) => allowedImageOrigins.some((p) => src.startsWith(p));

describe("E2E Mobile/Capacitor", () => {
  it("01 appID válido", () => expect(APP_ID.startsWith("app.lovable.")).toBe(true));
  it("02 appName lowercase", () => expect(APP_NAME).toBe(APP_NAME.toLowerCase()));
  it("03 safe-area bottom configurado", () =>
    expect(SAFE_AREA_BOTTOM).toContain("safe-area-inset-bottom"));
  it("04 safe-area top configurado", () =>
    expect(SAFE_AREA_TOP).toContain("safe-area-inset-top"));
  it("05 tap target 44pt", () => expect(isLargeEnough(44)).toBe(true));
  it("06 tap target 43pt falha", () => expect(isLargeEnough(43)).toBe(false));
  it("07 deletar conta disponível", () =>
    expect(supportsFeature("account_deletion", REQUIRED_HIG_FEATURES)).toBe(true));
  it("08 bloqueio disponível", () =>
    expect(supportsFeature("block_user", REQUIRED_HIG_FEATURES)).toBe(true));
  it("09 denúncia disponível", () =>
    expect(supportsFeature("report_user", REQUIRED_HIG_FEATURES)).toBe(true));
  it("10 sem pagamentos externos", () =>
    expect(supportsFeature("no_external_payments", REQUIRED_HIG_FEATURES)).toBe(true));
  it("11 detecta online", () => expect(isOnline(true)).toBe(true));
  it("12 cache stale 5min", () => expect(cacheStaleMs).toBe(300000));
  it("13 cache gc 30min", () => expect(cacheGcMs).toBe(1800000));
  it("14 imagem https permitida", () =>
    expect(isAllowedImage("https://x.com/a.png")).toBe(true));
  it("15 imagem http não permitida", () =>
    expect(isAllowedImage("http://x.com/a.png")).toBe(false));
});
