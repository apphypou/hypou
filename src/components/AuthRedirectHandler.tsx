import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { App as CapacitorApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { consumeOAuthPending, getNativeAuthPathFromUrl } from "@/lib/authRedirect";
import { getPostLoginRedirectDecision } from "@/lib/authRedirectState";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/utils";

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
  const { user } = useAuth();
  const { toast } = useToast();
  const handledLaunchUrlRef = useRef(false);
  const handledAuthUrlsRef = useRef(new Set<string>());

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;
    let listener: { remove: () => Promise<void> } | undefined;

    const parseAuthCallback = async (url: string) => {
      const route = getNativeAuthPathFromUrl(url);
      if (!route || cancelled) {
        return;
      }
      if (handledAuthUrlsRef.current.has(url)) {
        return;
      }
      handledAuthUrlsRef.current.add(url);

      const parsed = new URL(url);
      const query = new URLSearchParams(parsed.search);
      const code = query.get("code");
      const callbackError = query.get("error_description");

      if (callbackError) throw new Error(callbackError);
      if (!code || !consumeOAuthPending()) throw new Error("Fluxo de autenticação inválido ou expirado.");

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;

      await Browser.close().catch(() => undefined);
      navigate(route, { replace: true });
    };

    const setupListener = async () => {
      if (!handledLaunchUrlRef.current) {
        handledLaunchUrlRef.current = true;
        const launchUrl = await CapacitorApp.getLaunchUrl();
        if (launchUrl?.url) {
          void parseAuthCallback(launchUrl.url).catch((error) => {
            toast({
              title: "Erro ao entrar",
              description: getErrorMessage(error, "Não foi possível concluir o login."),
              variant: "destructive",
            });
          });
        }
      }

      listener = await CapacitorApp.addListener("appUrlOpen", ({ url }) => {
        void parseAuthCallback(url).catch((error) => {
          toast({
            title: "Erro ao entrar",
            description: getErrorMessage(error, "Não foi possível concluir o login."),
            variant: "destructive",
          });
        });
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
  }, [navigate, toast]);

  useEffect(() => {
    // If we landed on root with a leftover hash from OAuth, clean it up
    if (window.location.hash && /access_token|error/.test(window.location.hash)) {
      // Supabase will parse the hash; we just need to make sure we redirect after.
    }

    if (!user) return;
    const event = "SIGNED_IN";
    const postLoginRedirect = localStorage.getItem(POST_LOGIN_KEY);
    const decision = getPostLoginRedirectDecision({
      event,
      pathname: location.pathname,
      postLoginRedirect,
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
      setTimeout(() => {
        navigate(decision.to, { replace: true });
      }, 0);
    }
  }, [navigate, location.pathname, user]);

  return null;
};

export default AuthRedirectHandler;
