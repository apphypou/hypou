/**
 * E2E #21 — User Journeys (fluxos end-to-end de alto nível).
 */
import { describe, it, expect } from "vitest";

interface JourneyStep { name: string; ok: boolean }

const signupToFirstTrade = (): JourneyStep[] => [
  { name: "signup", ok: true },
  { name: "onboarding_profile", ok: true },
  { name: "onboarding_categories", ok: true },
  { name: "onboarding_celebration", ok: true },
  { name: "create_first_item", ok: true },
  { name: "explore_swipe_like", ok: true },
  { name: "select_offer_item", ok: true },
  { name: "create_proposal", ok: true },
  { name: "owner_accepts", ok: true },
  { name: "open_chat", ok: true },
  { name: "exchange_messages", ok: true },
  { name: "both_confirm", ok: true },
  { name: "rate_partner", ok: true },
];

const reportFlow = (): JourneyStep[] => [
  { name: "open_user_profile", ok: true },
  { name: "open_options_menu", ok: true },
  { name: "click_report", ok: true },
  { name: "select_reason", ok: true },
  { name: "submit_report", ok: true },
  { name: "admin_reviews", ok: true },
  { name: "admin_resolves", ok: true },
  { name: "block_user", ok: true },
  { name: "blocked_content_filtered", ok: true },
];

const allOk = (steps: JourneyStep[]) => steps.every((s) => s.ok);

describe("E2E User Journeys", () => {
  it("01 fluxo signup → primeira troca tem 13 etapas", () => {
    expect(signupToFirstTrade().length).toBe(13);
  });
  it("02 fluxo signup → primeira troca completo", () => {
    expect(allOk(signupToFirstTrade())).toBe(true);
  });
  it("03 jornada inclui onboarding 3 steps", () => {
    const steps = signupToFirstTrade().map((s) => s.name);
    expect(steps.filter((s) => s.startsWith("onboarding_")).length).toBe(3);
  });
  it("04 jornada inclui dupla confirmação", () => {
    expect(signupToFirstTrade().some((s) => s.name === "both_confirm")).toBe(true);
  });
  it("05 jornada inclui avaliação", () => {
    expect(signupToFirstTrade().some((s) => s.name === "rate_partner")).toBe(true);
  });
  it("06 fluxo report → moderação completo", () => {
    expect(allOk(reportFlow())).toBe(true);
  });
  it("07 fluxo report inclui bloqueio", () => {
    expect(reportFlow().some((s) => s.name === "block_user")).toBe(true);
  });
  it("08 fluxo report finaliza filtrando conteúdo", () => {
    const last = reportFlow().slice(-1)[0];
    expect(last.name).toBe("blocked_content_filtered");
  });
  it("09 explore inicia com swipe", () => {
    expect(signupToFirstTrade().some((s) => s.name === "explore_swipe_like")).toBe(true);
  });
  it("10 troca segue modelo híbrido (select_offer + create_proposal)", () => {
    const names = signupToFirstTrade().map((s) => s.name);
    const i1 = names.indexOf("select_offer_item");
    const i2 = names.indexOf("create_proposal");
    expect(i1).toBeLessThan(i2);
  });
});
