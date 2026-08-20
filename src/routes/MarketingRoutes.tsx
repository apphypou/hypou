import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

const Teste = lazy(() => import("@/pages/Teste"));
const Termos = lazy(() => import("@/pages/Termos"));
const Privacidade = lazy(() => import("@/pages/Privacidade"));

const RouteFallback = () => <div className="flex-1 bg-background" />;

export default function MarketingRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/teste" element={<Teste />} />
        <Route path="/termos" element={<Termos />} />
        <Route path="/privacidade" element={<Privacidade />} />
        <Route path="*" element={<Navigate replace to="/teste" />} />
      </Routes>
    </Suspense>
  );
}
