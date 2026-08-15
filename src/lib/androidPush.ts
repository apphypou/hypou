import { Capacitor } from "@capacitor/core";
import type { Channel } from "@capacitor/push-notifications";

type ChannelCreator = {
  createChannel(options: Channel): Promise<void>;
};

export const ensureAndroidNotificationChannel = async (push: ChannelCreator) => {
  if (Capacitor.getPlatform() !== "android") return;

  await push.createChannel({
    id: "default",
    name: "Hypou",
    description: "Mensagens, propostas, matches e chamadas do Hypou",
    importance: 5,
    visibility: 1,
    vibration: true,
    sound: "default",
  });
};
