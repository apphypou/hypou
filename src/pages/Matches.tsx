import { MessageSquare, Loader2 } from "lucide-react";
import ScreenLayout from "@/components/ScreenLayout";
import BottomNav from "@/components/BottomNav";
import GlassCard from "@/components/GlassCard";
import { useMatches } from "@/hooks/useMatches";
import { useNavigate } from "react-router-dom";

const Matches = () => {
  const { data: matches = [], isLoading } = useMatches();
  const navigate = useNavigate();

  const formatValue = (cents: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

  const getBadge = (match: typeof matches[0]) => {
    const age = Date.now() - new Date(match.created_at).getTime();
    if (age < 24 * 60 * 60 * 1000) return "Nova Proposta";
    if (match.status === "accepted") return "Aceita";
    return null;
  };

  return (
    <ScreenLayout>
      {/* Header */}
      <header className="relative z-40 flex w-full justify-between items-center px-6 pt-12 pb-4 shrink-0">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.2em] text-primary/70 font-bold mb-0.5">
            Suas Trocas
          </span>
          <h1 className="text-foreground text-3xl font-extrabold tracking-tight">
            Propostas de Troca
          </h1>
        </div>
        <div className="flex gap-3" />
      </header>

      {/* Main Content */}
      <main className="relative flex-1 w-full px-5 overflow-y-auto no-scrollbar z-10 pb-28">
        <div className="flex items-center justify-between mb-6 mt-2">
          <h2 className="text-sm font-bold text-foreground/90 uppercase tracking-widest">Interesses Recebidos</h2>
          <div className="flex items-center gap-1">
            <span className="text-primary text-xs font-semibold">{matches.length} Ativo{matches.length !== 1 ? "s" : ""}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-primary neon-glow" />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          </div>
        ) : matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-6xl mb-4">🤝</span>
            <h2 className="text-xl font-bold text-foreground mb-2">Nenhuma proposta ainda</h2>
            <p className="text-muted-foreground text-sm">Continue explorando para encontrar trocas!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 pb-6">
            {matches.map((match) => {
              const otherItem = match.my_item_side === "a" ? match.item_b : match.item_a;
              const mainImage = otherItem?.item_images?.[0]?.image_url;
              const badge = getBadge(match);

              return (
                <GlassCard
                  key={match.id}
                  hoverable
                  className="shadow-[0_4px_20px_hsl(184_100%_50%/0.15)] cursor-pointer"
                  onClick={() => navigate(`/match/${match.id}`)}
                >
                  {/* Image */}
                  <div className="relative h-48 w-full">
                    {mainImage ? (
                      <img alt={otherItem.name} className="h-full w-full object-cover" src={mainImage} />
                    ) : (
                      <div className="h-full w-full bg-card flex items-center justify-center">
                        <span className="text-4xl">📦</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                    {badge && (
                      <div className="absolute top-4 right-4 bg-background/60 backdrop-blur-md px-3 py-1 rounded-full border border-primary/30">
                        <span className="text-[10px] font-bold text-primary tracking-wider uppercase">{badge}</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-5 relative">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-foreground font-bold text-xl leading-tight mb-1">{otherItem.name}</h3>
                        <p className="text-foreground/50 text-xs">{otherItem.location || match.other_user.location || "Sem localização"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-primary font-bold text-lg text-glow">{formatValue(otherItem.market_value)}</p>
                        <p className="text-foreground/40 text-[10px]">Valor de mercado</p>
                      </div>
                    </div>

                    {/* Owner */}
                    <div className="mt-4 pt-4 border-t border-foreground/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          {match.other_user.avatar_url ? (
                            <img
                              alt={match.other_user.display_name || "Usuário"}
                              className="h-8 w-8 rounded-full object-cover border border-foreground/20"
                              src={match.other_user.avatar_url}
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-card border border-foreground/20 flex items-center justify-center text-xs font-bold text-foreground/40">
                              {(match.other_user.display_name || "?")[0]}
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-medium text-foreground/80">
                          {match.other_user.display_name || "Usuário"}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/match/${match.id}`);
                        }}
                        className="h-8 w-8 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav activeTab="trocas" />
    </ScreenLayout>
  );
};

export default Matches;
