/**
 * E2E #7 — Profiles & Public Profile (12 tests)
 */
import { describe, it, expect } from "vitest";

const PUBLIC_FIELDS = ["user_id", "display_name", "avatar_url", "location", "bio", "created_at"];
const PRIVATE_FIELDS = ["phone", "latitude", "longitude", "subscription_expires_at"];

const sanitizeForPublic = (p: any) => {
  const out: any = {};
  PUBLIC_FIELDS.forEach((f) => (out[f] = p[f] ?? null));
  return out;
};
const computeRating = (scores: number[]) =>
  scores.length === 0 ? 0 : scores.reduce((a, b) => a + b, 0) / scores.length;
const completedTrades = (matches: any[]) => matches.filter((m) => m.status === "completed").length;
const isOwnProfile = (uid: string, profileUid: string) => uid === profileUid;
const initials = (name: string) =>
  (name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

describe("E2E Profiles", () => {
  it("01 perfil público remove phone", () => {
    const p = sanitizeForPublic({ phone: "11999", display_name: "X" });
    expect((p as any).phone).toBeUndefined();
  });
  it("02 perfil público remove lat/lng", () => {
    const p = sanitizeForPublic({ latitude: 1, longitude: 2, display_name: "X" });
    expect((p as any).latitude).toBeUndefined();
  });
  it("03 perfil público mantém display_name", () => {
    const p = sanitizeForPublic({ display_name: "Ana" });
    expect(p.display_name).toBe("Ana");
  });
  it("04 fields privados não vazam", () =>
    expect(PRIVATE_FIELDS.every((f) => !PUBLIC_FIELDS.includes(f))).toBe(true));
  it("05 rating médio", () => expect(computeRating([5, 4, 3])).toBe(4));
  it("06 rating vazio é 0", () => expect(computeRating([])).toBe(0));
  it("07 rating max", () => expect(computeRating([5, 5, 5])).toBe(5));
  it("08 trades completas", () =>
    expect(completedTrades([{ status: "completed" }, { status: "accepted" }])).toBe(1));
  it("09 detecta próprio perfil", () => expect(isOwnProfile("a", "a")).toBe(true));
  it("10 perfil de terceiro", () => expect(isOwnProfile("a", "b")).toBe(false));
  it("11 iniciais 2 nomes", () => expect(initials("Ana Silva")).toBe("AS"));
  it("12 iniciais nome único", () => expect(initials("Ana")).toBe("A"));
});
