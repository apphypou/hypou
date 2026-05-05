// Update these when apps are published to the stores
export const APP_STORE_URL = "#";
export const PLAY_STORE_URL = "#";

export const detectPlatform = (): "ios" | "android" | "desktop" => {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
};
