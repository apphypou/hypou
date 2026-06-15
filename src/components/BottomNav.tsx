import { Compass, Handshake, MessageSquare, UserCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

type TabId = "explorar" | "shorts" | "trocas" | "chat" | "perfil";

interface BottomNavProps {
  activeTab: TabId;
}

// Prefetch route chunks on hover/touch so navigation feels instant
const routePrefetchers: Record<string, () => Promise<unknown>> = {
  "/partidas": () => import("@/pages/Matches"),
  "/chat": () => import("@/pages/Chat"),
  "/meu-perfil": () => import("@/pages/MeuPerfil"),
};

const prefetched = new Set<string>();
const prefetch = (path: string) => {
  if (prefetched.has(path)) return;
  prefetched.add(path);
  routePrefetchers[path]?.().catch(() => prefetched.delete(path));
};

const BottomNav = ({ activeTab }: BottomNavProps) => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const unreadCount = useUnreadCount();

  const navItems: { icon: typeof Compass; label: string; id: TabId; path: string; unreadCount?: number }[] = [
    { icon: Compass, label: "Explorar", id: "explorar", path: "/explorar" },
    { icon: Handshake, label: "Trocas", id: "trocas", path: "/partidas" },
    { icon: MessageSquare, label: "Chat", id: "chat", path: "/chat", unreadCount },
    { icon: UserCircle, label: "Perfil", id: "perfil", path: "/meu-perfil" },
  ];

  const formatBadge = (n: number) => (n > 99 ? "99+" : String(n));
  const handleLinkClick = (event: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    const isProtectedTab = path !== "/explorar";

    if (authLoading && isProtectedTab) {
      event.preventDefault();
      return;
    }

    if (!user && isProtectedTab) {
      event.preventDefault();
      navigate(`/login?redirect=${encodeURIComponent(path)}`);
    }
  };

  return (
    <div
      className="fixed left-4 right-4 flex justify-center"
      style={{ bottom: "calc(0.45rem + var(--safe-area-bottom))", zIndex: 40 }}
    >
      <nav className="bg-background/92 dark:bg-background/82 backdrop-blur-2xl border border-foreground/10 rounded-full px-2 py-1.5 flex items-center gap-1.5 w-full max-w-[22rem] relative shadow-[0_8px_24px_rgba(0,0,0,0.18)] dark:shadow-[0_8px_28px_rgba(0,0,0,0.42)]">
        {navItems.map((item) => {
          const isActive = item.id === activeTab;
          return (
            <Link
              key={item.id}
              to={item.path}
              onClick={(event) => handleLinkClick(event, item.path)}
              onPointerEnter={() => prefetch(item.path)}
              onTouchStart={() => prefetch(item.path)}
              className="relative flex flex-col items-center justify-center gap-0.5 rounded-full h-12 flex-1 z-10"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 bg-foreground rounded-full shadow-sm"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <item.icon
                className={`h-[18px] w-[18px] relative z-10 transition-colors duration-200 ${
                  isActive ? "text-background" : "text-foreground/70"
                }`}
              />
              <span
                className={`relative z-10 text-[9.5px] font-semibold leading-none transition-colors duration-200 ${
                  isActive ? "text-background" : "text-foreground/70"
                }`}
              >
                {item.label}
              </span>
              {item.unreadCount && item.unreadCount > 0 ? (
                <span
                  aria-label={`${item.unreadCount} novas mensagens`}
                  className="absolute top-1 right-[calc(50%-18px)] min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-none flex items-center justify-center border-2 border-background z-20"
                >
                  {formatBadge(item.unreadCount)}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;
