import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import { configureNativeKeyboardResize } from "@/lib/nativeKeyboard";
import { installGlobalErrorMonitoring } from "@/lib/observability";
import App from "./App.tsx";
import "./index.css";

installGlobalErrorMonitoring();

// Kill-switch: remove leftover PWA caches so app updates don't keep stale UI.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((regs) => Promise.all(regs.map((r) => r.unregister())))
    .catch(() => {});
}
if ("caches" in window) {
  caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).catch(() => {});
}

// Initialize native plugins when running on a native platform
if (Capacitor.isNativePlatform()) {
  import("@capacitor/status-bar").then(({ StatusBar, Style }) => {
    StatusBar.setStyle({ style: Style.Dark });
    StatusBar.setBackgroundColor({ color: "#1C1C1C" });
  });

  import("@capacitor/keyboard").then(({ Keyboard, KeyboardResize }) => {
    void configureNativeKeyboardResize(Keyboard, KeyboardResize.Native);

    const showKeyboard = () => {
      document.body.classList.add("keyboard-visible");
    };
    const hideKeyboard = () => {
      document.body.classList.remove("keyboard-visible");
    };

    Keyboard.addListener("keyboardWillShow", showKeyboard);
    Keyboard.addListener("keyboardDidShow", showKeyboard);
    Keyboard.addListener("keyboardWillHide", hideKeyboard);
    Keyboard.addListener("keyboardDidHide", hideKeyboard);
  });

  // Hide splash screen once app is rendered
  import("@capacitor/splash-screen").then(({ SplashScreen }) => {
    // Small delay to ensure first paint
    setTimeout(() => SplashScreen.hide(), 300);
  });

  // Block context menu on native (hides web behavior)
  document.addEventListener("contextmenu", (e) => e.preventDefault());
}

createRoot(document.getElementById("root")!).render(<App />);
