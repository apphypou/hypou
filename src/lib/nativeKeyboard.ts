import { Capacitor } from "@capacitor/core";

type KeyboardResizeController<TMode> = {
  setResizeMode(options: { mode: TMode }): Promise<void>;
};

export const configureNativeKeyboardResize = async <TMode>(
  keyboard: KeyboardResizeController<TMode>,
  mode: TMode,
) => {
  if (Capacitor.getPlatform() !== "ios") return;

  await keyboard.setResizeMode({ mode });
};
