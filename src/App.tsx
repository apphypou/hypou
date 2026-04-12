import { useState, useEffect } from "react";
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
import Index from "./pages/Index";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import RecuperarSenha from "./pages/RecuperarSenha";
import ResetPassword from "./pages/ResetPassword";
import Explorar from "./pages/Explorar";
import Busca from "./pages/Busca";
import Shorts from "./pages/Shorts";
import Matches from "./pages/Matches";
import Configuracoes from "./pages/Configuracoes";
import NovoItem from "./pages/NovoItem";
import EditarItem from "./pages/EditarItem";
import Match from "./pages/Match";
import Chat from "./pages/Chat";
import Conversa from "./pages/Conversa";
import Perfil from "./pages/Perfil";
import MeuPerfil from "./pages/MeuPerfil";
import PerfilUsuario from "./pages/PerfilUsuario";
import NotFound from "./pages/NotFound";
import ListaEspera from "./pages/ListaEspera";
import Termos from "./pages/Termos";
import Privacidade from "./pages/Privacidade";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsuarios from "./pages/admin/AdminUsuarios";
import AdminItens from "./pages/admin/AdminItens";
import AdminMatches from "./pages/admin/AdminMatches";
import AdminReports from "./pages/admin/AdminReports";
import AdminWaitlist from "./pages/admin/AdminWaitlist";
import AdminStatus from "./pages/admin/AdminStatus";
import AdminAssistente from "./pages/admin/AdminAssistente";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 30, // 30 min cache for offline resilience
      staleTime: 1000 * 60 * 2, // 2 min stale time
    },
  },
});

// Apply native class to body on Capacitor
if (Capacitor.isNativePlatform()) {
  document.body.classList.add("native-app");
}

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
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
        </Route>

        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
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
          <BrowserRouter>
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
