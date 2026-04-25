/**
 * Cross-platform haptic feedback.
 * - On native (Capacitor iOS/Android): uses @capacitor/haptics.
 * - On web Android: falls back to navigator.vibrate.
 * - On web desktop / iOS Safari: silent no-op.
 */
import { Capacitor } from "@capacitor/core";

type Intensity = "light" | "medium" | "heavy" | "success" | "warning" | "error";

const webVibratePatterns: Record<Intensity, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 35,
  success: [15, 40, 15],
  warning: [25, 60, 25],
  error: [40, 80, 40],
};

export const haptic = async (intensity: Intensity = "light") => {
  try {
    if (Capacitor.isNativePlatform()) {
      const { Haptics, ImpactStyle, NotificationType } = await import("@capacitor/haptics");
      switch (intensity) {
        case "light":
          return Haptics.impact({ style: ImpactStyle.Light });
        case "medium":
          return Haptics.impact({ style: ImpactStyle.Medium });
        case "heavy":
          return Haptics.impact({ style: ImpactStyle.Heavy });
        case "success":
          return Haptics.notification({ type: NotificationType.Success });
        case "warning":
          return Haptics.notification({ type: NotificationType.Warning });
        case "error":
          return Haptics.notification({ type: NotificationType.Error });
      }
    } else if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(webVibratePatterns[intensity]);
    }
  } catch {
    // no-op — haptics are progressive enhancement
  }
};
