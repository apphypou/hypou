import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  browserOpen: vi.fn(),
  isNativePlatform: vi.fn(),
  nativeSignIn: vi.fn(),
  signInWithOAuth: vi.fn(),
}));

vi.mock("@capacitor/browser", () => ({
  Browser: {
    open: mocks.browserOpen,
  },
}));

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: mocks.isNativePlatform,
  },
}));

vi.mock("@/lib/nativeSocialAuth", () => ({
  startNativeSocialSignIn: mocks.nativeSignIn,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithOAuth: mocks.signInWithOAuth,
    },
  },
}));

describe("startOAuthSignIn native fallback", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.signInWithOAuth.mockResolvedValue({ data: { url: "https://auth.example.test" }, error: null });
    mocks.browserOpen.mockResolvedValue(undefined);
  });

  it("uses native social sign in for Google on native platforms", async () => {
    mocks.isNativePlatform.mockReturnValue(true);
    mocks.nativeSignIn.mockResolvedValue({ handled: true, error: null });

    const { startOAuthSignIn } = await import("@/lib/oauth");
    const result = await startOAuthSignIn("google", "/explorar");

    expect(mocks.nativeSignIn).toHaveBeenCalledWith("google");
    expect(mocks.signInWithOAuth).not.toHaveBeenCalled();
    expect(mocks.browserOpen).not.toHaveBeenCalled();
    expect(result).toEqual({ error: null });
  });

  it("falls back to OAuth browser when native provider is not handled", async () => {
    mocks.isNativePlatform.mockReturnValue(true);
    mocks.nativeSignIn.mockResolvedValue({ handled: false, error: null });

    const { startOAuthSignIn } = await import("@/lib/oauth");
    const result = await startOAuthSignIn("google", "/explorar");

    expect(mocks.signInWithOAuth).toHaveBeenCalled();
    expect(mocks.browserOpen).toHaveBeenCalledWith({ url: "https://auth.example.test" });
    expect(result).toEqual({ error: null });
  });

  it("returns native error without opening browser", async () => {
    mocks.isNativePlatform.mockReturnValue(true);
    mocks.nativeSignIn.mockResolvedValue({ handled: true, error: new Error("Falha no login nativo.") });

    const { startOAuthSignIn } = await import("@/lib/oauth");
    const result = await startOAuthSignIn("apple", "/explorar");

    expect(mocks.signInWithOAuth).not.toHaveBeenCalled();
    expect(mocks.browserOpen).not.toHaveBeenCalled();
    expect(result.error?.message).toBe("Falha no login nativo.");
  });
});
