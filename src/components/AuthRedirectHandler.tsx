import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { getNativeAuthPathFromUrl } from "@/lib/authRedirect";
import { getPostLoginRedirectDecision } from "@/lib/authRedirectState";

const POST_LOGIN_KEY = "postLoginRedirect";

/**
 * Listens for SIGNED_IN events (e.g. after OAuth callback) and redirects the
 * user to the page they intended to reach before authenticating. Falls back
 * to /explorar.
 *
 * Apple OAuth occasionally lands the user on `/` or `/#` (form_post quirk),
 * so this handler ensures a smooth post-login experience.
 */
const AuthRedirectHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;
    let listener: { remove: () => Promise<void> } | undefined;

    const parseAuthCallback = async (url: string) => {
      const route = getNativeAuthPathFromUrl(url);
      if (!route || cancelled) return;

      const parsed = new URL(url);
      const query = new URLSearchParams(parsed.search);
      const hash = new URLSearchParams(parsed.hash.replace(/^#/, ""));
      const code = query.get("code");
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");

      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      } else if (accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
      }

      navigate(route, { replace: true });
    };

    const setupListener = async () => {
      const launchUrl = await CapacitorApp.getLaunchUrl();
      if (launchUrl?.url) {
        void parseAuthCallback(launchUrl.url);
      }

      listener = await CapacitorApp.addListener("appUrlOpen", ({ url }) => {
        void parseAuthCallback(url);
      });

      if (cancelled) {
        void listener.remove();
      }
    };

    void setupListener();

    return () => {
      cancelled = true;
      void listener?.remove();
    };
  }, [navigate]);

  useEffect(() => {
    // If we landed on root with a leftover hash from OAuth, clean it up
    if (window.location.hash && /access_token|error/.test(window.location.hash)) {
      // Supabase will parse the hash; we just need to make sure we redirect after.
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      const decision = getPostLoginRedirectDecision({
        event,
        pathname: location.pathname,
        postLoginRedirect: localStorage.getItem(POST_LOGIN_KEY),
      });

      if (decision.type === "clear") {
        localStorage.removeItem(POST_LOGIN_KEY);
        return;
      }

      if (decision.type === "navigate") {
        if (decision.clearPostLoginRedirect) {
          localStorage.removeItem(POST_LOGIN_KEY);
        }
        // Defer to next tick so AuthProvider state is updated
        setTimeout(() => navigate(decision.to, { replace: true }), 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  return null;
};

export default AuthRedirectHandler;
