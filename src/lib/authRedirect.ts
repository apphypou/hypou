import { Capacitor } from "@capacitor/core";

const NATIVE_AUTH_CALLBACK = "hypou://auth-callback";
const OAUTH_PENDING_KEY = "hypou:oauth-pending";
const OAUTH_PENDING_TTL_MS = 24 * 60 * 60 * 1000;

export const sanitizeInternalRedirect = (path: string | null, fallback = "/explorar") => {
  if (!path?.startsWith("/") || path.startsWith("//") || path.includes("\\")) return fallback;
  return path;
};

export const markOAuthPending = () => {
  localStorage.setItem(OAUTH_PENDING_KEY, String(Date.now()));
};

export const consumeOAuthPending = () => {
  const startedAt = Number(localStorage.getItem(OAUTH_PENDING_KEY));
  localStorage.removeItem(OAUTH_PENDING_KEY);
  return Number.isFinite(startedAt) && Date.now() - startedAt <= OAUTH_PENDING_TTL_MS;
};

export const getAuthRedirectUrl = (path = "/explorar") => {
  const normalizedPath = sanitizeInternalRedirect(path);

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

  const query = new URLSearchParams(parsed.search);
  for (const key of ["code", "error", "error_code", "error_description"]) query.delete(key);
  const suffix = query.toString();
  return `${sanitizeInternalRedirect(parsed.pathname)}${suffix ? `?${suffix}` : ""}`;
};
