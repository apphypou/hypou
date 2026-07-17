/**
 * E2E #2 — Onboarding Guard + Flow (10 tests)
 */
import { describe, it, expect } from "vitest";
import { getOnboardingRouteState } from "@/lib/onboarding";

const shouldRedirectToOnboarding = (user: any, profile: any) =>
  !!user && getOnboardingRouteState({ profile, isLoading: false, isFetching: false, isError: false }) === "onboarding";

const isValidGeo = (lat: number | null, lng: number | null) =>
  typeof lat === "number" && typeof lng === "number" &&
  lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

const ONBOARDING_STEPS = ["profile", "interests", "celebration"] as const;
const canAdvance = (idx: number, data: Record<string, unknown>) => {
  if (idx === 0) return !!data.display_name && isValidGeo(data.latitude as any, data.longitude as any);
  if (idx === 1) return Array.isArray(data.categories) && (data.categories as any[]).length >= 1;
  return true;
};

describe("E2E Onboarding", () => {
  it("01 redireciona quando onboarding incompleto", () =>
    expect(shouldRedirectToOnboarding({ id: "x" }, { onboarding_completed: false })).toBe(true));
  it("02 não redireciona quando completo", () =>
    expect(shouldRedirectToOnboarding({ id: "x" }, { onboarding_completed: true })).toBe(false));
  it("03 não redireciona sem user", () =>
    expect(shouldRedirectToOnboarding(null, { onboarding_completed: false })).toBe(false));
  it("04 redireciona para completar cadastro quando o profile não existe", () =>
    expect(shouldRedirectToOnboarding({ id: "x" }, null)).toBe(true));
  it("05 mantém a rota durante a atualização de um profile em cache", () =>
    expect(getOnboardingRouteState({
      profile: { onboarding_completed: false },
      isLoading: false,
      isFetching: true,
      isError: false,
    })).toBe("ready"));
  it("06 não manda para onboarding quando a consulta de profile falha", () =>
    expect(getOnboardingRouteState({
      profile: undefined,
      isLoading: false,
      isFetching: false,
      isError: true,
    })).toBe("ready"));
  it("07 fluxo tem 3 etapas", () => expect(ONBOARDING_STEPS.length).toBe(3));
  it("08 step1 exige nome e geo", () =>
    expect(canAdvance(0, { display_name: "Ana", latitude: -23, longitude: -46 })).toBe(true));
  it("09 step1 bloqueia sem geo", () =>
    expect(canAdvance(0, { display_name: "Ana" })).toBe(false));
  it("10 step2 exige ao menos 1 categoria", () =>
    expect(canAdvance(1, { categories: [] })).toBe(false));
  it("11 step2 aceita 1+ categoria", () =>
    expect(canAdvance(1, { categories: ["Eletrônicos"] })).toBe(true));
  it("12 valida lat/lng fora da Terra", () => expect(isValidGeo(91, 0)).toBe(false));
  it("13 aguarda o primeiro carregamento sem profile em cache", () =>
    expect(getOnboardingRouteState({
      profile: undefined,
      isLoading: false,
      isFetching: true,
      isError: false,
    })).toBe("loading"));
});
