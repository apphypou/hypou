import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { type AdminRole, useAdminRole } from "@/hooks/useAdminRole";

const AdminProtectedRoute = ({ children, allowedRoles = ["admin", "moderator"] }: { children: React.ReactNode; allowedRoles?: AdminRole[] }) => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const { data: roles = [], isLoading: roleLoading } = useAdminRole(user?.id);

  if (authLoading || (roleLoading && !!user)) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    const redirect = `${location.pathname}${location.search}`;
    return <Navigate to={`/admin/login?redirect=${encodeURIComponent(redirect)}`} replace />;
  }

  if (!roles.some((role) => allowedRoles.includes(role))) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-6 text-center text-foreground">
        <div>
          <h1 className="text-2xl font-bold">Acesso restrito</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sua conta não tem permissão para acessar o painel administrativo.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
