import { Capacitor, registerPlugin } from "@capacitor/core";
import type { Provider } from "@supabase/supabase-js";
import { GoogleSignIn } from "@capawesome/capacitor-google-sign-in";
import { supabase } from "@/integrations/supabase/client";

type NativeProvider = Extract<Provider, "google" | "apple">;

type NativeSocialResult = {
  handled: boolean;
  error: Error | null;
};

type NativeTokenResult = {
  token: string;
  accessToken?: string | null;
  nonce?: string;
};

type NativeError = Error & {
  code?: string;
};

type NativeAppleSignInPlugin = {
  authorize(options: {
    clientId: string;
    scopes: string;
  }): Promise<{
    identityToken: string;
    authorizationCode?: string;
    user?: string;
    email?: string;
    givenName?: string;
    familyName?: string;
    nonce?: string;
  }>;
};

type NativeGoogleSignInPlugin = {
  signIn(options: {
    clientId: string;
    scopes: string[];
  }): Promise<{
    idToken: string;
    accessToken?: string | null;
    serverAuthCode?: string | null;
    nonce?: string;
  }>;
  signOut(): Promise<void>;
};

const NativeAppleSignIn = registerPlugin<NativeAppleSignInPlugin>("NativeAppleSignIn");
const NativeGoogleSignIn = registerPlugin<NativeGoogleSignInPlugin>("NativeGoogleSignIn");

let initialized = false;

const googleWebClientId = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID;
const googleIOSClientId = import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID;
const appleClientId = import.meta.env.VITE_APPLE_CLIENT_ID || "app.hypou.mobile";

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  const payload = token.split(".")[1];
  if (!payload) return null;

  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const base64UrlEncode = (bytes: Uint8Array) => {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const sha256Hex = async (value: string) => {
  const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const createGoogleNoncePair = async () => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);

  const nonce = base64UrlEncode(bytes);
  return {
    nonce,
    hashedNonce: await sha256Hex(nonce),
  };
};

const hasNativeConfig = (provider: NativeProvider) => {
  const platform = Capacitor.getPlatform();

  if (provider === "apple") return platform === "ios";

  if (!googleWebClientId) return false;
  if (platform === "ios" && !googleIOSClientId) return false;

  return true;
};

const initializeGoogleSignIn = async () => {
  if (initialized) return;

  await GoogleSignIn.initialize({
    clientId: googleWebClientId,
    scopes: ["email", "profile"],
  });

  initialized = true;
};

const signInWithNativeProvider = async (provider: NativeProvider): Promise<NativeTokenResult> => {
  if (provider === "google") {
    const platform = Capacitor.getPlatform();
    const scopes = ["email", "profile"];

    if (platform === "ios") {
      const result = await NativeGoogleSignIn.signIn({
        clientId: googleWebClientId,
        scopes,
      });
      const tokenNonce = decodeJwtPayload(result.idToken)?.nonce;

      return {
        token: result.idToken,
        accessToken: result.accessToken,
        nonce: typeof tokenNonce === "string" ? result.nonce : undefined,
      };
    }

    await initializeGoogleSignIn();
    const noncePair = await createGoogleNoncePair().catch(() => null);
    const result = await GoogleSignIn.signIn(noncePair ? { nonce: noncePair.hashedNonce } : undefined);
    const tokenNonce = decodeJwtPayload(result.idToken)?.nonce;

    return {
      token: result.idToken,
      accessToken: result.accessToken,
      nonce: noncePair && typeof tokenNonce === "string" ? noncePair.nonce : undefined,
    };
  }

  const result = await NativeAppleSignIn.authorize({
    clientId: appleClientId,
    scopes: "email name",
  });
  const tokenNonce = decodeJwtPayload(result.identityToken)?.nonce;
  return {
    token: result.identityToken,
    nonce: typeof tokenNonce === "string" ? result.nonce : undefined,
  };
};

export const startNativeSocialSignIn = async (provider: NativeProvider): Promise<NativeSocialResult> => {
  if (!Capacitor.isNativePlatform() || !hasNativeConfig(provider)) {
    return { handled: false, error: null };
  }

  try {
    const { accessToken, nonce, token } = await signInWithNativeProvider(provider);

    if (!token) {
      return {
        handled: true,
        error: new Error("Login nativo não retornou token de identidade."),
      };
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider,
      token,
      ...(accessToken ? { access_token: accessToken } : {}),
      ...(nonce ? { nonce } : {}),
    });

    return { handled: true, error: error ? new Error(error.message) : null };
  } catch (error) {
    const nativeError = error as NativeError;
    if (provider === "apple" && nativeError.code === "APPLE_SIGN_IN_UNAVAILABLE") {
      return { handled: false, error: null };
    }

    return {
      handled: true,
      error: error instanceof Error ? error : new Error("Falha no login nativo."),
    };
  }
};
