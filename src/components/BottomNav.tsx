import { Compass, Handshake, MessageSquare, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

type TabId = "explorar" | "trocas" | "chat" | "perfil";

interface BottomNavProps {
  activeTab: TabId;
}

const navItems: { icon: typeof Compass; label: string; id: TabId; path: string; badge?: boolean }[] = [
  { icon: Compass, label: "Explorar", id: "explorar", path: "/explorar" },
  { icon: Handshake, label: "Trocas", id: "trocas", path: "/partidas" },
  { icon: MessageSquare, label: "Chat", id: "chat", path: "/chat" },
  { icon: UserCircle, label: "Perfil", id: "perfil", path: "/meu-perfil" },
];

const BottomNav = ({ activeTab }: BottomNavProps) => {
  const navigate = useNavigate();

  return (
    <div className="absolute bottom-0 left-0 right-0 z-50 w-full flex justify-center pb-6 px-5">
      <nav className="glass-panel rounded-full px-8 py-3 flex justify-between items-center w-full max-w-md">
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
                {item.badge && (
                  <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primary border border-background" />
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
