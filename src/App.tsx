import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";
import { BrowserRouter, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import AuthRedirectHandler from "@/components/AuthRedirectHandler";
import IncomingCallSheet from "@/components/IncomingCallSheet";
import OfflineScreen from "@/components/OfflineScreen";
import PendingTradeConfirmationDialog from "@/components/PendingTradeConfirmationDialog";
import { AuthProvider } from "@/hooks/useAuth";
import { useAppLifecycleSync } from "@/hooks/useAppLifecycleSync";
import { useGlobalRealtimeAlerts } from "@/hooks/useGlobalRealtimeAlerts";
import { usePushRegistration } from "@/hooks/usePushRegistration";
import { ThemeProvider } from "@/hooks/useTheme";
import { isMarketingRoute } from "@/lib/domainRouting";
import MarketingRoutes from "@/routes/MarketingRoutes";
import ProductRoutes from "@/routes/ProductRoutes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 30,
      staleTime: 1000 * 30,
      refetchOnWindowFocus: true,
      refetchOnReconnect: "always",
      refetchOnMount: true,
      retry: 1,
    },
  },
});

if (Capacitor.isNativePlatform()) {
  document.body.classList.add("native-app");
}

function GlobalAlerts() {
  useGlobalRealtimeAlerts();
  usePushRegistration();
  useAppLifecycleSync();
  return null;
}

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return isOnline;
}

function HostRoutes() {
  const location = useLocation();
  const isMarketing = !Capacitor.isNativePlatform()
    && typeof window !== "undefined"
    && isMarketingRoute(window.location.hostname, location.pathname);

  if (isMarketing) {
    return <MarketingRoutes />;
  }

  return (
    <AuthProvider>
      <AuthRedirectHandler />
      <GlobalAlerts />
      <IncomingCallSheet />
      <PendingTradeConfirmationDialog />
      <ProductRoutes />
    </AuthProvider>
  );
}

export default function App() {
  const isOnline = useOnlineStatus();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {!isOnline && <OfflineScreen />}
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <HostRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
