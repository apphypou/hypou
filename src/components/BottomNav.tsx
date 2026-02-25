import { Compass, Handshake, MessageSquare, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUnreadCount } from "@/hooks/useUnreadCount";

type TabId = "explorar" | "trocas" | "chat" | "perfil";

interface BottomNavProps {
  activeTab: TabId;
}

const BottomNav = ({ activeTab }: BottomNavProps) => {
  const navigate = useNavigate();
  const unreadCount = useUnreadCount();

  const navItems: { icon: typeof Compass; label: string; id: TabId; path: string; badge?: number }[] = [
    { icon: Compass, label: "Explorar", id: "explorar", path: "/explorar" },
    { icon: Handshake, label: "Trocas", id: "trocas", path: "/partidas" },
    { icon: MessageSquare, label: "Chat", id: "chat", path: "/chat", badge: unreadCount },
    { icon: UserCircle, label: "Perfil", id: "perfil", path: "/meu-perfil" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 w-full">
      <nav className="bg-background border-t border-border px-8 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex justify-between items-center w-full max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = item.id === activeTab;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 transition-colors relative ${
                isActive ? "text-primary" : "text-foreground/50 hover:text-foreground/80"
              }`}
            >
              <div className="relative flex items-center justify-center h-8 w-8">
                <item.icon className={`h-6 w-6 ${isActive ? "text-glow" : ""}`} />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center border-2 border-background">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-bold tracking-wider uppercase">{item.label}</span>
              {isActive && (
                <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-primary neon-glow" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;
