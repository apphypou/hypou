import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";

const PUBLIC_APP_URL = "https://hypou.lovable.app";

type ShareContent = {
  title: string;
  text: string;
  url: string;
};

export const buildPublicItemUrl = (itemId: string) =>
  `${PUBLIC_APP_URL}/item/${encodeURIComponent(itemId)}`;

export const shareContent = async ({ title, text, url }: ShareContent) => {
  if (Capacitor.isNativePlatform()) {
    await Share.share({ title, text, url, dialogTitle: title });
    return;
  }

  if (typeof navigator.share === "function") {
    await navigator.share({ title, text, url });
    return;
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(`${text} ${url}`);
    return;
  }

  throw new Error("Compartilhamento indisponível neste dispositivo.");
};
