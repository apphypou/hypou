import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import RecuperarSenha from "./pages/RecuperarSenha";
import ResetPassword from "./pages/ResetPassword";
import Explorar from "./pages/Explorar";
import Matches from "./pages/Matches";
import Configuracoes from "./pages/Configuracoes";
import NovoItem from "./pages/NovoItem";
import Match from "./pages/Match";
import Chat from "./pages/Chat";
import Conversa from "./pages/Conversa";
import Perfil from "./pages/Perfil";
import MeuPerfil from "./pages/MeuPerfil";
import PerfilUsuario from "./pages/PerfilUsuario";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/recuperar-senha" element={<RecuperarSenha />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Onboarding (requires auth but NOT onboarding check) */}
            <Route path="/onboarding" element={
              <ProtectedRoute requireOnboarding={false}>
                <Perfil />
              </ProtectedRoute>
            } />

            {/* Protected routes (require auth + completed onboarding) */}
            <Route path="/explorar" element={
              <ProtectedRoute><Explorar /></ProtectedRoute>
            } />
            <Route path="/partidas" element={
              <ProtectedRoute><Matches /></ProtectedRoute>
            } />
            <Route path="/match/:matchId" element={
              <ProtectedRoute><Match /></ProtectedRoute>
            } />
            <Route path="/chat" element={
              <ProtectedRoute><Chat /></ProtectedRoute>
            } />
            <Route path="/chat/:conversationId" element={
              <ProtectedRoute><Conversa /></ProtectedRoute>
            } />
            <Route path="/meu-perfil" element={
              <ProtectedRoute><MeuPerfil /></ProtectedRoute>
            } />
            <Route path="/configuracoes" element={
              <ProtectedRoute><Configuracoes /></ProtectedRoute>
            } />
            <Route path="/novo-item" element={
              <ProtectedRoute><NovoItem /></ProtectedRoute>
            } />
            <Route path="/usuario/:userId" element={
              <ProtectedRoute><PerfilUsuario /></ProtectedRoute>
            } />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
