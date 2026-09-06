import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { getAuthRedirectUrl, markOAuthPending } from "@/lib/authRedirect";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { forgetDevicePushToken, getRememberedDevicePushToken } from "@/lib/devicePushToken";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: Error | null; user: User | null; emailAlreadyRegistered: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;
    let listener: { remove: () => Promise<void> } | undefined;
    void CapacitorApp.addListener("appStateChange", async ({ isActive }) => {
      if (!isActive || cancelled) return;
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    }).then((handle) => {
      listener = handle;
      if (cancelled) void handle.remove();
    });

    return () => {
      cancelled = true;
      void listener?.remove();
    };
  }, []);

  const signUp = async (email: string, password: string, displayName: string) => {
    if (Capacitor.isNativePlatform()) markOAuthPending();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: getAuthRedirectUrl("/onboarding"),
      },
    });
    // With email confirmation enabled Supabase intentionally returns an
    // obfuscated user for an existing email. `identities` is empty in that
    // response, which lets this registration form avoid sending a new OTP.
    const emailAlreadyRegistered = !error && !!data.user && data.user.identities?.length === 0;
    return { error: error as Error | null, user: data?.user ?? null, emailAlreadyRegistered };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    const pushToken = getRememberedDevicePushToken();
    if (pushToken) {
      const { error } = await supabase.rpc("unregister_device_token", { p_token: pushToken });
      if (!error) forgetDevicePushToken();
    }
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    window.dispatchEvent(new Event("hypou:signed-out"));
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
