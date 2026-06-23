import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  appleAuthorize: vi.fn(),
  googleInitialize: vi.fn(),
  googleSignIn: vi.fn(),
  nativeGoogleSignIn: vi.fn(),
  nativeGoogleSignOut: vi.fn(),
  isNativePlatform: vi.fn(),
  getPlatform: vi.fn(),
  signInWithIdToken: vi.fn(),
}));

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: mocks.isNativePlatform,
    getPlatform: mocks.getPlatform,
  },
  registerPlugin: (name: string) => {
    if (name === "NativeGoogleSignIn") {
      return {
        signIn: mocks.nativeGoogleSignIn,
        signOut: mocks.nativeGoogleSignOut,
      };
    }

    return {
      authorize: mocks.appleAuthorize,
    };
  },
}));

vi.mock("@capawesome/capacitor-google-sign-in", () => ({
  GoogleSignIn: {
    initialize: mocks.googleInitialize,
    signIn: mocks.googleSignIn,
  },
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithIdToken: mocks.signInWithIdToken,
    },
  },
}));

describe("native social auth", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    mocks.isNativePlatform.mockReturnValue(true);
    mocks.getPlatform.mockReturnValue("ios");
    mocks.signInWithIdToken.mockResolvedValue({ data: { session: { access_token: "session" } }, error: null });
  });

  it("falls back when native Google config is missing", async () => {
    vi.stubEnv("VITE_GOOGLE_WEB_CLIENT_ID", "");
    vi.stubEnv("VITE_GOOGLE_IOS_CLIENT_ID", "");

    const { startNativeSocialSignIn } = await import("@/lib/nativeSocialAuth");
    const result = await startNativeSocialSignIn("google");

    expect(mocks.googleInitialize).not.toHaveBeenCalled();
    expect(mocks.googleSignIn).not.toHaveBeenCalled();
    expect(mocks.signInWithIdToken).not.toHaveBeenCalled();
    expect(result).toEqual({ handled: false, error: null });
  });

  it("uses the iOS native Google bridge nonce as the raw Supabase nonce", async () => {
    vi.stubEnv("VITE_GOOGLE_WEB_CLIENT_ID", "web-client-id.apps.googleusercontent.com");
    vi.stubEnv("VITE_GOOGLE_IOS_CLIENT_ID", "ios-client-id.apps.googleusercontent.com");
    const header = btoa(JSON.stringify({ alg: "none" }));
    const payload = btoa(JSON.stringify({ nonce: "hashed-google-token-nonce" }));
    mocks.nativeGoogleSignIn.mockResolvedValue({
      idToken: `${header}.${payload}.signature`,
      accessToken: "google-access-token",
      nonce: "raw-google-nonce",
    });

    const { startNativeSocialSignIn } = await import("@/lib/nativeSocialAuth");
    const result = await startNativeSocialSignIn("google");

    expect(mocks.nativeGoogleSignIn).toHaveBeenCalledWith({
      clientId: "web-client-id.apps.googleusercontent.com",
      scopes: ["email", "profile"],
    });
    expect(mocks.googleInitialize).not.toHaveBeenCalled();
    expect(mocks.googleSignIn).not.toHaveBeenCalled();
    expect(mocks.signInWithIdToken).toHaveBeenCalledWith({
      provider: "google",
      token: `${header}.${payload}.signature`,
      access_token: "google-access-token",
      nonce: "raw-google-nonce",
    });
    expect(result).toEqual({ handled: true, error: null });
  });

  it("passes a hashed nonce to Google and the raw nonce to Supabase on Android", async () => {
    mocks.getPlatform.mockReturnValue("android");
    vi.stubEnv("VITE_GOOGLE_WEB_CLIENT_ID", "web-client-id.apps.googleusercontent.com");
    const header = btoa(JSON.stringify({ alg: "none" }));
    mocks.googleSignIn.mockImplementation(({ nonce }: { nonce: string }) => {
      const payload = btoa(JSON.stringify({ nonce }));
      return Promise.resolve({
        idToken: `${header}.${payload}.signature`,
        accessToken: "google-access-token",
      });
    });

    const { startNativeSocialSignIn } = await import("@/lib/nativeSocialAuth");
    const result = await startNativeSocialSignIn("google");

    const googleSignInOptions = mocks.googleSignIn.mock.calls[0][0];
    const supabasePayload = mocks.signInWithIdToken.mock.calls[0][0];
    expect(mocks.googleInitialize).toHaveBeenCalledWith({
      clientId: "web-client-id.apps.googleusercontent.com",
      scopes: ["email", "profile"],
    });
    expect(googleSignInOptions.nonce).toMatch(/^[a-f0-9]{64}$/);
    expect(supabasePayload).toMatchObject({
      provider: "google",
      access_token: "google-access-token",
    });
    expect(supabasePayload.nonce).not.toBe(googleSignInOptions.nonce);
    expect(result).toEqual({ handled: true, error: null });
  });

  it("signs into Supabase with Apple id token and raw nonce returned by native login", async () => {
    const header = btoa(JSON.stringify({ alg: "none" }));
    const payload = btoa(JSON.stringify({ nonce: "hashed-apple-nonce" }));
    const identityToken = `${header}.${payload}.signature`;
    mocks.appleAuthorize.mockResolvedValue({
      identityToken,
      nonce: "raw-apple-nonce",
    });

    const { startNativeSocialSignIn } = await import("@/lib/nativeSocialAuth");
    const result = await startNativeSocialSignIn("apple");

    expect(mocks.appleAuthorize).toHaveBeenCalledWith({
      clientId: "app.hypou.mobile",
      scopes: "email name",
    });
    expect(mocks.signInWithIdToken).toHaveBeenCalledWith({
      provider: "apple",
      token: identityToken,
      nonce: "raw-apple-nonce",
    });
    expect(result).toEqual({ handled: true, error: null });
  });

  it("falls back to browser OAuth when native Apple is unavailable on the device", async () => {
    const error = new Error("Sign in with Apple is unavailable.") as Error & { code: string };
    error.code = "APPLE_SIGN_IN_UNAVAILABLE";
    mocks.appleAuthorize.mockRejectedValue(error);

    const { startNativeSocialSignIn } = await import("@/lib/nativeSocialAuth");
    const result = await startNativeSocialSignIn("apple");

    expect(mocks.signInWithIdToken).not.toHaveBeenCalled();
    expect(result).toEqual({ handled: false, error: null });
  });

  it("returns handled false when platform is web", async () => {
    mocks.isNativePlatform.mockReturnValue(false);

    const { startNativeSocialSignIn } = await import("@/lib/nativeSocialAuth");
    const result = await startNativeSocialSignIn("apple");

    expect(mocks.appleAuthorize).not.toHaveBeenCalled();
    expect(mocks.googleSignIn).not.toHaveBeenCalled();
    expect(mocks.signInWithIdToken).not.toHaveBeenCalled();
    expect(result).toEqual({ handled: false, error: null });
  });

  it("returns an error when native login does not include an id token", async () => {
    mocks.appleAuthorize.mockResolvedValue({ identityToken: "" });

    const { startNativeSocialSignIn } = await import("@/lib/nativeSocialAuth");
    const result = await startNativeSocialSignIn("apple");

    expect(mocks.signInWithIdToken).not.toHaveBeenCalled();
    expect(result.handled).toBe(true);
    expect(result.error?.message).toBe("Login nativo não retornou token de identidade.");
  });
});
