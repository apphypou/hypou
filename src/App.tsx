import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminProtectedRoute from "@/components/admin/AdminProtectedRoute";
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
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsuarios from "./pages/admin/AdminUsuarios";
import AdminItens from "./pages/admin/AdminItens";
import AdminMatches from "./pages/admin/AdminMatches";
import AdminReports from "./pages/admin/AdminReports";
import AdminWaitlist from "./pages/admin/AdminWaitlist";
import AdminStatus from "./pages/admin/AdminStatus";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
            {/* Public routes */}
            <Route path="/" element={<ListaEspera />} />
            <Route path="/lista-espera" element={<ListaEspera />} />
            <Route path="/welcome" element={<Index />} />
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
            <Route path="/explorar" element={<Explorar />} />
            <Route path="/busca" element={
              <ProtectedRoute><Busca /></ProtectedRoute>
            } />
            <Route path="/shorts" element={
              <ProtectedRoute><Shorts /></ProtectedRoute>
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
            <Route path="/editar-item/:itemId" element={
              <ProtectedRoute><EditarItem /></ProtectedRoute>
            } />
            <Route path="/usuario/:userId" element={
              <ProtectedRoute><PerfilUsuario /></ProtectedRoute>
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
            </Route>

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
