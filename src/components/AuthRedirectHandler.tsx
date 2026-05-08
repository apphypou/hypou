import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

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
    // If we landed on root with a leftover hash from OAuth, clean it up
    if (window.location.hash && /access_token|error/.test(window.location.hash)) {
      // Supabase will parse the hash; we just need to make sure we redirect after.
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        const target = localStorage.getItem(POST_LOGIN_KEY);
        const landedOnEntry = ["/", "/login", "/cadastro"].includes(location.pathname);
        if (target) {
          localStorage.removeItem(POST_LOGIN_KEY);
          // Defer to next tick so AuthProvider state is updated
          setTimeout(() => navigate(target, { replace: true }), 0);
        } else if (landedOnEntry) {
          setTimeout(() => navigate("/explorar", { replace: true }), 0);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  return null;
};

export default AuthRedirectHandler;
