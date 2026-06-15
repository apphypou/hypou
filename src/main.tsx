import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import App from "./App.tsx";
import "./index.css";

// Kill-switch: remove any leftover service worker / caches from previous versions
// so users always see the latest published bundle without clearing cookies.
if (!Capacitor.isNativePlatform()) {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => Promise.all(regs.map((r) => r.unregister())))
      .catch(() => {});
  }
  if ("caches" in window) {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).catch(() => {});
  }
}

// Initialize native plugins when running on a native platform
if (Capacitor.isNativePlatform()) {
  document.documentElement.style.setProperty("--keyboard-height", "0px");

  import("@capacitor/status-bar").then(({ StatusBar, Style }) => {
    StatusBar.setStyle({ style: Style.Dark });
    StatusBar.setBackgroundColor({ color: "#1C1C1C" });
  });

  import("@capacitor/keyboard").then(({ Keyboard, KeyboardResize }) => {
    Keyboard.setResizeMode({ mode: KeyboardResize.None });

    Keyboard.addListener("keyboardWillShow", (info) => {
      document.documentElement.style.setProperty("--keyboard-height", `${info.keyboardHeight}px`);
      document.body.classList.add("keyboard-visible");
    });
    Keyboard.addListener("keyboardWillHide", () => {
      document.documentElement.style.setProperty("--keyboard-height", "0px");
      document.body.classList.remove("keyboard-visible");
    });
    Keyboard.addListener("keyboardDidHide", () => {
      document.documentElement.style.setProperty("--keyboard-height", "0px");
      document.body.classList.remove("keyboard-visible");
    });
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
