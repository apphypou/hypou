import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import App from "./App.tsx";
import "./index.css";

// Initialize native plugins when running on a native platform
if (Capacitor.isNativePlatform()) {
  import("@capacitor/status-bar").then(({ StatusBar, Style }) => {
    StatusBar.setStyle({ style: Style.Dark });
    StatusBar.setBackgroundColor({ color: "#0a0a0a" });
  });

  import("@capacitor/keyboard").then(({ Keyboard, KeyboardResize }) => {
    Keyboard.setResizeMode({ mode: KeyboardResize.Body });
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
