import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";

export const productEventNames = [
  "app_opened",
  "session_started",
  "onboarding_completed",
  "search_performed",
  "item_created",
  "item_viewed",
  "swipe_created",
  "favorite_created",
  "trade_started",
  "trade_accepted",
  "trade_completed",
  "message_sent",
  "nps_answered",
] as const;

export type ProductEventName = (typeof productEventNames)[number];

type ProductEventProperties = Record<string, boolean | number | string | null>;

const sessionId = typeof crypto !== "undefined" && "randomUUID" in crypto
  ? crypto.randomUUID()
  : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function getPlatform(): "ios" | "android" | "web" {
  if (!Capacitor.isNativePlatform()) return "web";
  return Capacitor.getPlatform() === "ios" ? "ios" : "android";
}

function sanitizeProperties(properties: ProductEventProperties): ProductEventProperties {
  return Object.fromEntries(
    Object.entries(properties)
      .filter(([, value]) => value === null || ["boolean", "number", "string"].includes(typeof value))
      .map(([key, value]) => [key.slice(0, 64), typeof value === "string" ? value.slice(0, 160) : value]),
  );
}

/**
 * Product analytics must never block the core app flow. Events contain no
 * personal text, only event-specific operational properties.
 */
export async function trackProductEvent(
  eventName: ProductEventName,
  userId: string,
  properties: ProductEventProperties = {},
) {
  if (!userId) return;

  await supabase.from("product_events").insert({
    event_name: eventName,
    user_id: userId,
    session_id: sessionId,
    platform: getPlatform(),
    app_version: import.meta.env.VITE_APP_VERSION || null,
    properties: sanitizeProperties(properties),
  });
}

export function trackProductEventSafely(
  eventName: ProductEventName,
  userId: string,
  properties: ProductEventProperties = {},
) {
  void trackProductEvent(eventName, userId, properties).catch(() => {
    // Analytics failure must not affect a trade, message, search or item.
  });
}
