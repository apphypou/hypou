import { Compass, Handshake, MessageSquare, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUnreadCount } from "@/hooks/useUnreadCount";
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
  const unreadCount = useUnreadCount();

  const navItems: { icon: typeof Compass; label: string; id: TabId; path: string; unreadCount?: number }[] = [
    { icon: Compass, label: "Explorar", id: "explorar", path: "/explorar" },
    { icon: Handshake, label: "Trocas", id: "trocas", path: "/partidas" },
    { icon: MessageSquare, label: "Chat", id: "chat", path: "/chat", unreadCount },
    { icon: UserCircle, label: "Perfil", id: "perfil", path: "/meu-perfil" },
  ];

  const formatBadge = (n: number) => (n > 99 ? "99+" : String(n));

  return (
    <div className="fixed left-5 right-5 z-50 flex justify-center" style={{ bottom: "calc(1.5rem + var(--safe-area-bottom))" }}>
      <nav className="bg-background/80 dark:bg-background/40 backdrop-blur-2xl border border-foreground/8 rounded-full px-3 py-2 flex items-center gap-2 w-full max-w-md relative shadow-[0_4px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.2)]">
        {navItems.map((item) => {
          const isActive = item.id === activeTab;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              onPointerEnter={() => prefetch(item.path)}
              onTouchStart={() => prefetch(item.path)}
              className="relative flex items-center justify-center rounded-full h-12 flex-1 z-10"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 bg-foreground rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <item.icon
                className={`h-5 w-5 relative z-10 transition-colors duration-200 ${
                  isActive ? "text-background" : "text-muted-foreground"
                }`}
              />
              {item.unreadCount && item.unreadCount > 0 ? (
                <span
                  aria-label={`${item.unreadCount} novas mensagens`}
                  className="absolute top-0.5 right-[calc(50%-18px)] min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-none flex items-center justify-center border-2 border-background z-20"
                >
                  {formatBadge(item.unreadCount)}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;
