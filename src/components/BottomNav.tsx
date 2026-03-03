import { Compass, Handshake, MessageSquare, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { motion, AnimatePresence } from "framer-motion";

type TabId = "explorar" | "trocas" | "chat" | "perfil";

interface BottomNavProps {
  activeTab: TabId;
}

const BottomNav = ({ activeTab }: BottomNavProps) => {
  const navigate = useNavigate();
  const unreadCount = useUnreadCount();

  const navItems: { icon: typeof Compass; label: string; id: TabId; path: string; hasUnread?: boolean }[] = [
    { icon: Compass, label: "Explorar", id: "explorar", path: "/explorar" },
    { icon: Handshake, label: "Trocas", id: "trocas", path: "/partidas" },
    { icon: MessageSquare, label: "Chat", id: "chat", path: "/chat", hasUnread: unreadCount > 0 },
    { icon: UserCircle, label: "Perfil", id: "perfil", path: "/meu-perfil" },
  ];

  return (
    <div className="fixed bottom-6 left-5 right-5 z-50 flex justify-center">
      <nav className="bg-background/40 backdrop-blur-2xl border border-foreground/8 rounded-full px-3 py-2 flex items-center gap-2 w-full max-w-md relative shadow-[0_4px_30px_rgba(0,0,0,0.2)]">
        {navItems.map((item) => {
          const isActive = item.id === activeTab;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
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
              {item.hasUnread && (
                <span className="absolute top-1.5 right-[calc(50%-4px)] translate-x-3 h-2 w-2 rounded-full bg-primary z-20" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;
