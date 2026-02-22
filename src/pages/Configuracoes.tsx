import { ArrowLeft, LogOut, Info, Smartphone, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ScreenLayout from "@/components/ScreenLayout";
import BottomNav from "@/components/BottomNav";
import IconButton from "@/components/IconButton";
import GlassCard from "@/components/GlassCard";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const Configuracoes = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      navigate("/");
    } finally {
      setLoggingOut(false);
    }
  };

  const menuItems = [
    {
      icon: Info,
      label: "Sobre o Hypou",
      description: "Conheça mais sobre a plataforma",
      onClick: undefined,
    },
    {
      icon: Smartphone,
      label: "Versão do App",
      description: "v1.0.0",
      onClick: undefined,
    },
  ];

  return (
    <ScreenLayout>
      <header className="relative z-40 flex w-full items-center gap-3 px-6 pt-12 pb-4">
        <IconButton icon={ArrowLeft} size="sm" onClick={() => navigate(-1)} />
        <span className="text-sm font-bold tracking-wider uppercase text-foreground/80">Configurações</span>
      </header>

      <main className="flex-1 w-full px-5 overflow-y-auto no-scrollbar pb-28">
        <div className="flex flex-col gap-3 mt-2">
          {menuItems.map((item) => (
            <GlassCard
              key={item.label}
              hoverable={!!item.onClick}
              className="p-4 flex items-center gap-4"
              onClick={item.onClick}
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-foreground font-semibold text-sm">{item.label}</h3>
                <p className="text-foreground/40 text-xs">{item.description}</p>
              </div>
              {item.onClick && <ChevronRight className="h-4 w-4 text-foreground/30" />}
            </GlassCard>
          ))}

          {/* Logout */}
          <GlassCard
            hoverable
            className="p-4 flex items-center gap-4 mt-4 border-danger/20"
            onClick={handleLogout}
          >
            <div className="h-10 w-10 rounded-xl bg-danger/10 flex items-center justify-center shrink-0">
              {loggingOut ? (
                <Loader2 className="h-5 w-5 text-danger animate-spin" />
              ) : (
                <LogOut className="h-5 w-5 text-danger" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-danger font-semibold text-sm">Sair da Conta</h3>
              <p className="text-foreground/40 text-xs">Encerrar sessão atual</p>
            </div>
          </GlassCard>
        </div>
      </main>

      <BottomNav activeTab="perfil" />
    </ScreenLayout>
  );
};

export default Configuracoes;
