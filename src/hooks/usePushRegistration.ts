import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

/**
 * Registers the native device for FCM push and stores the token in `device_tokens`.
 * No-op on web — we keep in-app realtime notifications there.
 *
 * Also handles taps on incoming notifications (foreground & background) and
 * navigates to the right screen via window.location (works from outside Router).
 */
export function usePushRegistration() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    if (!Capacitor.isNativePlatform()) return;

    let cleanup: (() => void) | null = null;

    (async () => {
      try {
        const { PushNotifications } = await import("@capacitor/push-notifications");

        // Permission
        let perm = await PushNotifications.checkPermissions();
        if (perm.receive === "prompt" || perm.receive === "prompt-with-rationale") {
          perm = await PushNotifications.requestPermissions();
        }
        if (perm.receive !== "granted") return;

        await PushNotifications.register();

        const reg = await PushNotifications.addListener("registration", async (token) => {
          const platform = Capacitor.getPlatform() === "ios" ? "ios" : "android";
          await supabase
            .from("device_tokens")
            .upsert(
              { user_id: user.id, token: token.value, platform },
              { onConflict: "token" },
            );
        });

        const err = await PushNotifications.addListener("registrationError", (e) => {
          console.error("Push registration error", e);
        });

        // Foreground notification arrived — let in-app realtime handle UI; nothing to do here
        const recv = await PushNotifications.addListener("pushNotificationReceived", () => {});

        // User tapped a notification → navigate
        const tap = await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
          const data: any = action.notification?.data || {};
          const type = data.type;
          if (type === "call" && data.conversation_id) {
            // Send to /chat — the IncomingCallSheet will handle the active session via realtime
            window.location.assign(`/chat/${data.conversation_id}`);
          } else if (type === "message" && data.conversation_id) {
            window.location.assign(`/chat/${data.conversation_id}`);
          } else if ((type === "match" || type === "proposal") && data.match_id) {
            window.location.assign(`/match/${data.match_id}`);
          } else {
            window.location.assign("/chat");
          }
        });

        cleanup = () => {
          reg.remove();
          err.remove();
          recv.remove();
          tap.remove();
        };
      } catch (e) {
        console.error("usePushRegistration failed", e);
      }
    })();

    return () => {
      cleanup?.();
    };
  }, [user?.id]);
}
