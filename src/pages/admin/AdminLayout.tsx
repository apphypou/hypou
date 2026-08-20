import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, CalendarDays, ChevronDown, CircleHelp, Command, Search } from "lucide-react";

const routeLabels: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/metricas": "Métricas",
  "/admin/usuarios": "Usuários",
  "/admin/itens": "Itens",
  "/admin/matches": "Trocas",
  "/admin/reports": "Relatos",
  "/admin/waitlist": "Waitlist",
  "/admin/testadores-beta": "Testadores beta",
  "/admin/membros": "Membros",
  "/admin/status": "Status",
  "/admin/assistente": "Assistente IA",
  "/admin/lancamento": "Lançamento",
};

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const currentLabel = routeLabels[location.pathname] || "Admin";
  const today = useMemo(
    () => new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" }).format(new Date()),
    [],
  );

  const navigateFromSearch = () => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    if (!term) return;
    const destination = Object.entries(routeLabels).find(([, label]) => label.toLocaleLowerCase("pt-BR").includes(term));
    if (destination) {
      navigate(destination[0]);
      setSearch("");
    }
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigateFromSearch();
  };

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  return (
    <SidebarProvider style={{ "--sidebar-width": "12.875rem", "--sidebar-width-icon": "3.5rem" } as CSSProperties}>
      <div className="admin-shell min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0 bg-background">
          <header className="admin-topbar sticky top-0 z-10">
            <div className="admin-topbar__left">
              <SidebarTrigger className="admin-topbar__menu" />
              <div className="admin-date-control hidden lg:flex">
                <CalendarDays className="h-4 w-4" />
                <span>{today}</span>
              </div>
              <button type="button" className="admin-date-control hidden xl:flex" aria-label="Comparar com o período anterior">
                <span>Comparar com: período anterior</span>
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            <div className="admin-topbar__right">
              <form className="admin-global-search hidden md:flex" onSubmit={submitSearch}>
                <Search className="h-4 w-4" />
                <input ref={searchInputRef} aria-label="Buscar páginas do painel" placeholder="Buscar usuários, itens, trocas..." value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); navigateFromSearch(); } }} />
                <kbd><Command className="h-3 w-3" />K</kbd>
              </form>
              <button type="button" className="admin-icon-button md:hidden" aria-label="Buscar no painel"><Search className="h-4 w-4" /></button>
              <button type="button" className="admin-icon-button" aria-label="Notificações"><Bell className="h-4 w-4" /></button>
              <button type="button" className="admin-icon-button hidden sm:inline-flex" aria-label="Ajuda"><CircleHelp className="h-4 w-4" /></button>
              <div className="flex items-center gap-2.5 pl-1">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                    {(profile?.display_name || user?.email || "A")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium text-foreground hidden lg:block max-w-[104px] truncate">
                  {profile?.display_name || user?.email || currentLabel}
                </span>
                <ChevronDown className="hidden lg:block h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
          </header>

          <main className="admin-content flex-1 overflow-auto p-4 md:p-6 xl:p-7">
            <div className="mx-auto max-w-[1536px]">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
