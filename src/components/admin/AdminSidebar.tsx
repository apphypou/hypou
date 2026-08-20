import {
  LayoutDashboard,
  BarChart3,
  Users,
  Package,
  Handshake,
  ShieldAlert,
  ListOrdered,
  Activity,
  LogOut,
  Bot,
  Rocket,
  FlaskConical,
  Crown,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HYPOU_LOGO } from "@/config/brand";
import { useAdminRole } from "@/hooks/useAdminRole";

const groups = [
  { title: "Visão geral", items: [{ title: "Dashboard", url: "/admin", icon: LayoutDashboard }, { title: "Métricas", url: "/admin/metricas", icon: BarChart3 }] },
  { title: "Plataforma", items: [{ title: "Usuários", url: "/admin/usuarios", icon: Users }, { title: "Itens", url: "/admin/itens", icon: Package }, { title: "Trocas", url: "/admin/matches", icon: Handshake }] },
  { title: "Suporte e risco", items: [{ title: "Relatos", url: "/admin/reports", icon: ShieldAlert }, { title: "Status", url: "/admin/status", icon: Activity }] },
  { title: "Crescimento", items: [{ title: "Waitlist", url: "/admin/waitlist", icon: ListOrdered }, { title: "Testadores beta", url: "/admin/testadores-beta", icon: FlaskConical }, { title: "Lançamento", url: "/admin/lancamento", icon: Rocket, adminOnly: true }] },
  { title: "Configurações", items: [{ title: "Membros", url: "/admin/membros", icon: Crown, adminOnly: true }, { title: "Assistente IA", url: "/admin/assistente", icon: Bot }] },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { profile } = useProfile();
  const { data: roles = [] } = useAdminRole(user?.id);
  const isAdmin = roles.includes("admin");

  const isActive = (path: string) =>
    path === "/admin"
      ? location.pathname === "/admin"
      : location.pathname.startsWith(path);

  return (
    <Sidebar collapsible="icon" className="admin-sidebar border-r-0">
      <SidebarHeader className="admin-sidebar__header !px-4 !pt-4 !pb-2">
        <div className="flex items-center justify-center">
          <img src={HYPOU_LOGO} alt="Hypou" className={collapsed ? "h-7 w-7 object-cover object-left" : "h-auto w-[92px]"} />
        </div>
      </SidebarHeader>

      <SidebarContent className="admin-sidebar__content">
        {groups.map((group) => {
          const items = group.items.filter((item) => !item.adminOnly || isAdmin);
          if (!items.length) return null;
          return <SidebarGroup key={group.title} className="admin-nav-section">
          {!collapsed && <p>{group.title}</p>}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {items.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/admin"}
                        className={`admin-sidebar-link ${active ? "is-active" : ""}`}
                        activeClassName=""
                      >
                        {active && (
                          <div className="admin-sidebar-link__rail" />
                        )}
                        <item.icon className={collapsed ? "h-4 w-4" : "h-4 w-4 mr-3"} />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>})}
      </SidebarContent>

      <SidebarFooter className="admin-sidebar__footer">
        {!collapsed && (
          <div className="admin-user-card">
            <Avatar className="h-8 w-8 ring-1 ring-border">
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                {(profile?.display_name || user?.email || "A")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p>
                {profile?.display_name || "Equipe Hypou"}
              </p>
              <p className="admin-user-card__role">
                {isAdmin ? "Administrador" : "Moderador"}
              </p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="admin-signout"
          onClick={async () => {
            await signOut();
            navigate("/admin/login");
          }}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {!collapsed && "Sair"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
