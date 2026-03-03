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
    <div className="fixed bottom-6 left-6 right-6 z-50 flex justify-center">
      <nav className="bg-card/80 backdrop-blur-xl border border-border rounded-full px-6 py-2 flex justify-between items-center w-full max-w-md">
        {navItems.map((item) => {
          const isActive = item.id === activeTab;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className="flex items-center justify-center transition-all relative"
            >
              <div
                className={`relative flex items-center justify-center rounded-full transition-all duration-300 ${
                  isActive
                    ? "h-12 w-12 bg-primary/15 border border-primary/30"
                    : "h-10 w-10"
                }`}
              >
                <item.icon
                  className={`transition-all duration-300 ${
                    isActive
                      ? "h-6 w-6 text-primary text-glow"
                      : "h-5 w-5 text-muted-foreground hover:text-foreground"
                  }`}
                />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;
