import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useTheme } from "@/hooks/useTheme";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

const routeLabels: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/usuarios": "Usuários",
  "/admin/itens": "Itens",
  "/admin/matches": "Matches",
  "/admin/reports": "Reports",
  "/admin/waitlist": "Waitlist",
  "/admin/status": "Status",
  "/admin/assistente": "Assistente IA",
  "/admin/lancamento": "Lançamento",
};

const AdminLayout = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { theme, setTheme } = useTheme();

  const currentLabel = routeLabels[location.pathname] || "Admin";
  const isSubPage = location.pathname !== "/admin";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/20">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header with blur + breadcrumbs */}
          <header className="h-14 flex items-center justify-between border-b border-transparent dark:border-white/[0.04] px-4 md:px-6 bg-background/80 backdrop-blur-lg sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="mr-1" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    {isSubPage ? (
                      <BreadcrumbLink href="/admin" className="text-xs">Admin</BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage className="text-xs">Admin</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {isSubPage && (
                    <>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage className="text-xs">{currentLabel}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </>
                  )}
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                    {(profile?.display_name || user?.email || "A")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium text-muted-foreground hidden md:block max-w-[120px] truncate">
                  {profile?.display_name || user?.email}
                </span>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
