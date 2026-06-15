import { describe, expect, it } from "vitest";
import { getPostLoginRedirectDecision } from "@/lib/authRedirectState";

describe("auth redirect state", () => {
  it("clears stale post-login redirects while the user is already inside the app", () => {
    expect(
      getPostLoginRedirectDecision({
        event: "SIGNED_IN",
        pathname: "/chat",
        postLoginRedirect: "/explorar",
      })
    ).toEqual({ type: "clear" });
  });

  it("uses post-login redirect only from entry pages", () => {
    expect(
      getPostLoginRedirectDecision({
        event: "SIGNED_IN",
        pathname: "/login",
        postLoginRedirect: "/partidas",
      })
    ).toEqual({ type: "navigate", to: "/partidas", clearPostLoginRedirect: true });
  });

  it("falls back to explore only from entry pages", () => {
    expect(
      getPostLoginRedirectDecision({
        event: "SIGNED_IN",
        pathname: "/",
        postLoginRedirect: null,
      })
    ).toEqual({ type: "navigate", to: "/explorar", clearPostLoginRedirect: false });
  });

  it("does nothing on protected pages when there is no pending redirect", () => {
    expect(
      getPostLoginRedirectDecision({
        event: "SIGNED_IN",
        pathname: "/meu-perfil",
        postLoginRedirect: null,
      })
    ).toEqual({ type: "none" });
  });
});
