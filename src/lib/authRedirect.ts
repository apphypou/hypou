import { Capacitor } from "@capacitor/core";

const NATIVE_AUTH_CALLBACK = "hypou://auth-callback";

export const getAuthRedirectUrl = (path = "/explorar") => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (Capacitor.isNativePlatform()) {
    return `${NATIVE_AUTH_CALLBACK}${normalizedPath}`;
  }

  return `${window.location.origin}${normalizedPath}`;
};

export const getNativeAuthPathFromUrl = (url: string) => {
  const parsed = new URL(url);

  if (parsed.protocol !== "hypou:" || parsed.hostname !== "auth-callback") {
    return null;
  }

  return `${parsed.pathname || "/explorar"}${parsed.search}`;
};
