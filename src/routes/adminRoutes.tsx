import { lazy } from "react";
import { Route } from "react-router-dom";
import AdminProtectedRoute from "@/components/admin/AdminProtectedRoute";

const AdminLayout = __HYPOU_MOBILE_BUILD__ ? null : lazy(() => import("@/pages/admin/AdminLayout"));
const AdminDashboard = __HYPOU_MOBILE_BUILD__ ? null : lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminMetrics = __HYPOU_MOBILE_BUILD__ ? null : lazy(() => import("@/pages/admin/AdminMetrics"));
const AdminUsuarios = __HYPOU_MOBILE_BUILD__ ? null : lazy(() => import("@/pages/admin/AdminUsuarios"));
const AdminItens = __HYPOU_MOBILE_BUILD__ ? null : lazy(() => import("@/pages/admin/AdminItens"));
const AdminMatches = __HYPOU_MOBILE_BUILD__ ? null : lazy(() => import("@/pages/admin/AdminMatches"));
const AdminReports = __HYPOU_MOBILE_BUILD__ ? null : lazy(() => import("@/pages/admin/AdminReports"));
const AdminWaitlist = __HYPOU_MOBILE_BUILD__ ? null : lazy(() => import("@/pages/admin/AdminWaitlist"));
const AdminBetaTesters = __HYPOU_MOBILE_BUILD__ ? null : lazy(() => import("@/pages/admin/AdminBetaTesters"));
const AdminMembers = __HYPOU_MOBILE_BUILD__ ? null : lazy(() => import("@/pages/admin/AdminMembers"));
const AdminStatus = __HYPOU_MOBILE_BUILD__ ? null : lazy(() => import("@/pages/admin/AdminStatus"));
const AdminAssistente = __HYPOU_MOBILE_BUILD__ ? null : lazy(() => import("@/pages/admin/AdminAssistente"));
const AdminLancamento = __HYPOU_MOBILE_BUILD__ ? null : lazy(() => import("@/pages/admin/AdminLancamento"));
const AdminLogin = __HYPOU_MOBILE_BUILD__ ? null : lazy(() => import("@/pages/admin/AdminLogin"));

export const adminRoutes = !__HYPOU_MOBILE_BUILD__ && AdminLayout ? (
  <>
    <Route path="/admin/login" element={AdminLogin && <AdminLogin />} />
    <Route
      path="/admin"
      element={(
        <AdminProtectedRoute>
          <AdminLayout />
        </AdminProtectedRoute>
      )}
    >
      <Route index element={AdminDashboard && <AdminDashboard />} />
      <Route path="metricas" element={AdminMetrics && <AdminMetrics />} />
      <Route path="usuarios" element={AdminUsuarios && <AdminUsuarios />} />
      <Route path="itens" element={AdminItens && <AdminItens />} />
      <Route path="matches" element={AdminMatches && <AdminMatches />} />
      <Route path="reports" element={AdminReports && <AdminReports />} />
      <Route path="waitlist" element={AdminWaitlist && <AdminWaitlist />} />
      <Route path="testadores-beta" element={AdminBetaTesters && <AdminBetaTesters />} />
      <Route path="membros" element={AdminMembers && <AdminProtectedRoute allowedRoles={["admin"]}><AdminMembers /></AdminProtectedRoute>} />
      <Route path="status" element={AdminStatus && <AdminStatus />} />
      <Route path="assistente" element={AdminAssistente && <AdminAssistente />} />
      <Route path="lancamento" element={AdminLancamento && <AdminProtectedRoute allowedRoles={["admin"]}><AdminLancamento /></AdminProtectedRoute>} />
    </Route>
  </>
) : null;
