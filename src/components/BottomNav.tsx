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
    <div className="fixed bottom-6 left-5 right-5 z-50 flex justify-center">
      <nav className="bg-secondary border border-border rounded-full px-3 py-2 flex items-center gap-2 w-full max-w-md">
        {navItems.map((item) => {
          const isActive = item.id === activeTab;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`relative flex items-center justify-center rounded-full transition-all duration-300 ${
                isActive
                  ? "h-12 w-16 bg-foreground"
                  : "h-10 flex-1"
              }`}
            >
              <item.icon
                className={`h-5 w-5 transition-all duration-300 ${
                  isActive
                    ? "text-background"
                    : "text-muted-foreground"
                }`}
              />
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;
