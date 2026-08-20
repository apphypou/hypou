import { lazy, Suspense } from "react";
import { AnimatePresence } from "framer-motion";
import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import PageTransition from "@/components/PageTransition";
import ProtectedRoute from "@/components/ProtectedRoute";
import { adminRoutes } from "./adminRoutes";

import Login from "@/pages/Login";
import Explorar from "@/pages/Explorar";

const Cadastro = lazy(() => import("@/pages/Cadastro"));
const ConfirmarCodigo = lazy(() => import("@/pages/ConfirmarCodigo"));
const RecuperarSenha = lazy(() => import("@/pages/RecuperarSenha"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const Busca = lazy(() => import("@/pages/Busca"));
const Shorts = lazy(() => import("@/pages/Shorts"));
const Matches = lazy(() => import("@/pages/Matches"));
const Configuracoes = lazy(() => import("@/pages/Configuracoes"));
const NovoItem = lazy(() => import("@/pages/NovoItem"));
const EditarItem = lazy(() => import("@/pages/EditarItem"));
const Match = lazy(() => import("@/pages/Match"));
const Chat = lazy(() => import("@/pages/Chat"));
const Conversa = lazy(() => import("@/pages/Conversa"));
const Perfil = lazy(() => import("@/pages/Perfil"));
const MeuPerfil = lazy(() => import("@/pages/MeuPerfil"));
const PerfilUsuario = lazy(() => import("@/pages/PerfilUsuario"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const ListaEspera = lazy(() => import("@/pages/ListaEspera"));
const Baixar = lazy(() => import("@/pages/Baixar"));
const Termos = lazy(() => import("@/pages/Termos"));
const Privacidade = lazy(() => import("@/pages/Privacidade"));
const Chamada = lazy(() => import("@/pages/Chamada"));
const ChamadasPerdidas = lazy(() => import("@/pages/ChamadasPerdidas"));

const RouteFallback = () => <div className="flex-1 bg-background" />;

function ItemRedirect() {
  const { itemId } = useParams();
  return <Navigate replace to={`/explorar?item=${encodeURIComponent(itemId || "")}`} />;
}

export default function ProductRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <Suspense fallback={<RouteFallback />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><Login /></PageTransition>} />
          <Route path="/lista-espera" element={<PageTransition><ListaEspera /></PageTransition>} />
          <Route path="/baixar" element={<PageTransition><Baixar /></PageTransition>} />
          <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
          <Route path="/cadastro" element={<PageTransition><Cadastro /></PageTransition>} />
          <Route path="/confirmar-codigo" element={<PageTransition><ConfirmarCodigo /></PageTransition>} />
          <Route path="/recuperar-senha" element={<PageTransition><RecuperarSenha /></PageTransition>} />
          <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
          <Route path="/termos" element={<PageTransition><Termos /></PageTransition>} />
          <Route path="/privacidade" element={<PageTransition><Privacidade /></PageTransition>} />
          <Route path="/onboarding" element={<ProtectedRoute requireOnboarding={false}><PageTransition><Perfil /></PageTransition></ProtectedRoute>} />
          <Route path="/explorar" element={<PageTransition><Explorar /></PageTransition>} />
          <Route path="/item/:itemId" element={<ItemRedirect />} />
          <Route path="/busca" element={<ProtectedRoute><PageTransition><Busca /></PageTransition></ProtectedRoute>} />
          <Route path="/shorts" element={<ProtectedRoute><PageTransition><Shorts /></PageTransition></ProtectedRoute>} />
          <Route path="/partidas" element={<ProtectedRoute><PageTransition><Matches /></PageTransition></ProtectedRoute>} />
          <Route path="/match/:matchId" element={<ProtectedRoute><PageTransition><Match /></PageTransition></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><PageTransition><Chat /></PageTransition></ProtectedRoute>} />
          <Route path="/chat/:conversationId" element={<ProtectedRoute><PageTransition><Conversa /></PageTransition></ProtectedRoute>} />
          <Route path="/chamada/:roomName" element={<ProtectedRoute><Chamada /></ProtectedRoute>} />
          <Route path="/chamadas" element={<ProtectedRoute><PageTransition><ChamadasPerdidas /></PageTransition></ProtectedRoute>} />
          <Route path="/meu-perfil" element={<ProtectedRoute><PageTransition><MeuPerfil /></PageTransition></ProtectedRoute>} />
          <Route path="/configuracoes" element={<ProtectedRoute><PageTransition><Configuracoes /></PageTransition></ProtectedRoute>} />
          <Route path="/novo-item" element={<ProtectedRoute><PageTransition><NovoItem /></PageTransition></ProtectedRoute>} />
          <Route path="/editar-item/:itemId" element={<ProtectedRoute><PageTransition><EditarItem /></PageTransition></ProtectedRoute>} />
          <Route path="/usuario/:userId" element={<ProtectedRoute><PageTransition><PerfilUsuario /></PageTransition></ProtectedRoute>} />
          {adminRoutes}
          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}
