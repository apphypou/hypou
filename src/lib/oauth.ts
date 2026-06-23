import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import type { Provider } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getAuthRedirectUrl } from "@/lib/authRedirect";
import { startNativeSocialSignIn } from "@/lib/nativeSocialAuth";

const nativeProviders = new Set<Provider>(["google", "apple"]);

export const startOAuthSignIn = async (provider: Provider, path = "/explorar") => {
  if (Capacitor.isNativePlatform() && nativeProviders.has(provider)) {
    const nativeResult = await startNativeSocialSignIn(provider as "google" | "apple");

    if (nativeResult.handled) {
      return { error: nativeResult.error };
    }
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: getAuthRedirectUrl(path),
      skipBrowserRedirect: Capacitor.isNativePlatform(),
    },
  });

  if (error) return { error };

  if (Capacitor.isNativePlatform() && data.url) {
    await Browser.open({ url: data.url });
  }

  return { error: null };
};
