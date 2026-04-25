import { useState, useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Capacitor } from "@capacitor/core";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminProtectedRoute from "@/components/admin/AdminProtectedRoute";
import OfflineScreen from "@/components/OfflineScreen";
import PageTransition from "@/components/PageTransition";

// Eager-load critical entry routes for instant first paint
import Index from "./pages/Index";
import Login from "./pages/Login";
import Explorar from "./pages/Explorar";

// Lazy-load everything else to keep the initial bundle small
const Cadastro = lazy(() => import("./pages/Cadastro"));
const RecuperarSenha = lazy(() => import("./pages/RecuperarSenha"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Busca = lazy(() => import("./pages/Busca"));
const Shorts = lazy(() => import("./pages/Shorts"));
const Matches = lazy(() => import("./pages/Matches"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const NovoItem = lazy(() => import("./pages/NovoItem"));
const EditarItem = lazy(() => import("./pages/EditarItem"));
const Match = lazy(() => import("./pages/Match"));
const Chat = lazy(() => import("./pages/Chat"));
const Conversa = lazy(() => import("./pages/Conversa"));
const Perfil = lazy(() => import("./pages/Perfil"));
const MeuPerfil = lazy(() => import("./pages/MeuPerfil"));
const PerfilUsuario = lazy(() => import("./pages/PerfilUsuario"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ListaEspera = lazy(() => import("./pages/ListaEspera"));
const Termos = lazy(() => import("./pages/Termos"));
const Privacidade = lazy(() => import("./pages/Privacidade"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsuarios = lazy(() => import("./pages/admin/AdminUsuarios"));
const AdminItens = lazy(() => import("./pages/admin/AdminItens"));
const AdminMatches = lazy(() => import("./pages/admin/AdminMatches"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminWaitlist = lazy(() => import("./pages/admin/AdminWaitlist"));
const AdminStatus = lazy(() => import("./pages/admin/AdminStatus"));
const AdminAssistente = lazy(() => import("./pages/admin/AdminAssistente"));
const AdminLancamento = lazy(() => import("./pages/admin/AdminLancamento"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 30, // 30 min cache for offline resilience
      staleTime: 1000 * 60 * 5, // 5 min — avoid refetch flicker between tabs
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
    },
  },
});

// Apply native class to body on Capacitor
if (Capacitor.isNativePlatform()) {
  document.body.classList.add("native-app");
}

// Lightweight fallback — no spinner to avoid flash on fast chunks
const RouteFallback = () => <div className="flex-1 bg-background" />;

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <Suspense fallback={<RouteFallback />}>
        <Routes location={location} key={location.pathname}>
          {/* Public routes */}
          <Route path="/" element={<PageTransition><Index /></PageTransition>} />
          <Route path="/lista-espera" element={<PageTransition><ListaEspera /></PageTransition>} />
          <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
          <Route path="/cadastro" element={<PageTransition><Cadastro /></PageTransition>} />
          <Route path="/recuperar-senha" element={<PageTransition><RecuperarSenha /></PageTransition>} />
          <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
          <Route path="/termos" element={<PageTransition><Termos /></PageTransition>} />
          <Route path="/privacidade" element={<PageTransition><Privacidade /></PageTransition>} />

          {/* Onboarding */}
          <Route path="/onboarding" element={
            <ProtectedRoute requireOnboarding={false}>
              <PageTransition><Perfil /></PageTransition>
            </ProtectedRoute>
          } />

          {/* Protected routes */}
          <Route path="/explorar" element={<PageTransition><Explorar /></PageTransition>} />
          <Route path="/busca" element={
            <ProtectedRoute><PageTransition><Busca /></PageTransition></ProtectedRoute>
          } />
          <Route path="/shorts" element={
            <ProtectedRoute><PageTransition><Shorts /></PageTransition></ProtectedRoute>
          } />
          <Route path="/partidas" element={
            <ProtectedRoute><PageTransition><Matches /></PageTransition></ProtectedRoute>
          } />
          <Route path="/match/:matchId" element={
            <ProtectedRoute><PageTransition><Match /></PageTransition></ProtectedRoute>
          } />
          <Route path="/chat" element={
            <ProtectedRoute><PageTransition><Chat /></PageTransition></ProtectedRoute>
          } />
          <Route path="/chat/:conversationId" element={
            <ProtectedRoute><PageTransition><Conversa /></PageTransition></ProtectedRoute>
          } />
          <Route path="/meu-perfil" element={
            <ProtectedRoute><PageTransition><MeuPerfil /></PageTransition></ProtectedRoute>
          } />
          <Route path="/configuracoes" element={
            <ProtectedRoute><PageTransition><Configuracoes /></PageTransition></ProtectedRoute>
          } />
          <Route path="/novo-item" element={
            <ProtectedRoute><PageTransition><NovoItem /></PageTransition></ProtectedRoute>
          } />
          <Route path="/editar-item/:itemId" element={
            <ProtectedRoute><PageTransition><EditarItem /></PageTransition></ProtectedRoute>
          } />
          <Route path="/usuario/:userId" element={
            <ProtectedRoute><PageTransition><PerfilUsuario /></PageTransition></ProtectedRoute>
          } />

          {/* Admin routes */}
          <Route path="/admin" element={
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="usuarios" element={<AdminUsuarios />} />
            <Route path="itens" element={<AdminItens />} />
            <Route path="matches" element={<AdminMatches />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="waitlist" element={<AdminWaitlist />} />
            <Route path="status" element={<AdminStatus />} />
            <Route path="assistente" element={<AdminAssistente />} />
            <Route path="lancamento" element={<AdminLancamento />} />
          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
};

const useOnlineStatus = () => {
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
};

const App = () => {
  const isOnline = useOnlineStatus();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {!isOnline && <OfflineScreen />}
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthProvider>
              <AnimatedRoutes />
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
