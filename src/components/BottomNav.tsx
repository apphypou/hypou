import { Compass, Handshake, MessageSquare, UserCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { motion } from "framer-motion";
import { Capacitor } from "@capacitor/core";
import { shouldHideBottomNav } from "@/lib/bottomNavVisibility";

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
  const bottomOffset = Capacitor.isNativePlatform() ? "-0.5rem" : "0.75rem";
  const pathname = typeof window === "undefined" ? "" : window.location.pathname;

  if (shouldHideBottomNav(pathname, false)) return null;

  const navItems: { icon: typeof Compass; label: string; id: TabId; path: string; unreadCount?: number }[] = [
    { icon: Compass, label: "Explorar", id: "explorar", path: "/explorar" },
    { icon: Handshake, label: "Trocas", id: "trocas", path: "/partidas" },
    { icon: MessageSquare, label: "Chat", id: "chat", path: "/chat", unreadCount },
    { icon: UserCircle, label: "Perfil", id: "perfil", path: "/meu-perfil" },
  ];

  const formatBadge = (n: number) => (n > 99 ? "99+" : String(n));
  return (
    <div
      className="hypou-bottom-nav-wrapper fixed left-4 right-4 flex justify-center pointer-events-none"
      style={{
        bottom: `calc(${bottomOffset} + var(--safe-area-bottom))`,
        zIndex: 40,
        transform: "translateZ(0)",
        WebkitTransform: "translateZ(0)",
      }}
    >
      <nav className="hypou-bottom-nav pointer-events-auto rounded-full px-2 py-1.5 flex items-center gap-1.5 w-full max-w-[22rem] relative backdrop-blur-2xl">
        {navItems.map((item) => {
          const isActive = item.id === activeTab;
          return (
            <Link
              key={item.id}
              to={item.path}
              onPointerEnter={() => prefetch(item.path)}
              onPointerDown={(event) => {
                event.stopPropagation();
                prefetch(item.path);
              }}
              onTouchStart={(event) => {
                event.stopPropagation();
                prefetch(item.path);
              }}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                if (!isActive) {
                  navigate(item.path);
                }
              }}
              className="relative flex flex-col items-center justify-center gap-0.5 rounded-full h-12 flex-1 z-10 touch-manipulation select-none"
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
