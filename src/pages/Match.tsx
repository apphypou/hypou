import { X, Zap, MessageSquare, Star, Sparkles, Diamond, ArrowUpRight, Handshake, Loader2 } from "lucide-react";
import NeonButton from "@/components/NeonButton";
import { useMatch } from "@/hooks/useMatches";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMatchRating } from "@/hooks/useRatings";
import RatingDialog from "@/components/RatingDialog";
import { useState } from "react";

const Match = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const { data: match, isLoading } = useMatch(matchId || null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showRating, setShowRating] = useState(false);

  const otherUserId = match
    ? (match.my_item_side === "a" ? match.other_user.user_id : match.other_user.user_id)
    : undefined;

  const { data: existingRating } = useMatchRating(matchId || undefined, user?.id);

  // Get conversation ID for this match
  const { data: convData } = useQuery({
    queryKey: ["match-conversation", matchId],
    queryFn: async () => {
      const { data } = await supabase
        .from("conversations")
        .select("id")
        .eq("match_id", matchId!)
        .single();
      return data;
    },
    enabled: !!matchId,
  });

  const handleStartChat = () => {
    if (convData?.id) {
      navigate(`/chat/${convData.id}`);
    } else {
      navigate("/chat");
    }
  };

  const formatValue = (cents: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

  if (isLoading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center bg-background text-center px-6">
        <span className="text-6xl mb-4">🤷</span>
        <h2 className="text-xl font-bold text-foreground mb-2">Match não encontrado</h2>
        <NeonButton variant="ghost" onClick={() => navigate("/partidas")}>Voltar</NeonButton>
      </div>
    );
  }

  const myItem = match.my_item_side === "a" ? match.item_a : match.item_b;
  const theirItem = match.my_item_side === "a" ? match.item_b : match.item_a;
  const myImage = myItem?.item_images?.[0]?.image_url;
  const theirImage = theirItem?.item_images?.[0]?.image_url;

  return (
    <div className="relative flex h-[100dvh] w-full flex-col bg-background overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background to-background" />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent" />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-60">
        <Star className="absolute top-[15%] left-[10%] h-5 w-5 text-primary animate-float fill-primary" />
        <Diamond className="absolute top-[25%] right-[15%] h-3 w-3 text-primary animate-float-delayed opacity-60" />
        <div className="absolute top-[10%] left-[50%] h-2 w-2 rounded-full bg-primary/40 animate-pulse" />
        <Sparkles className="absolute bottom-[40%] left-[5%] h-4 w-4 text-primary/50 animate-float-delayed rotate-45" />
        <ArrowUpRight className="absolute bottom-[30%] right-[10%] h-3 w-3 text-primary animate-pulse" />
      </div>

      {/* Top Bar */}
      <div className="flex items-center p-6 justify-between relative z-10">
        <button
          onClick={() => navigate("/partidas")}
          className="flex items-center justify-center h-10 w-10 rounded-full bg-foreground/5 backdrop-blur-sm border border-foreground/10 text-foreground hover:bg-foreground/10 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-1 opacity-50">
          <Zap className="h-4 w-4 text-primary fill-primary" />
          <span className="text-primary text-xs font-bold tracking-widest uppercase">Hype!</span>
        </div>
        <div className="h-10 w-10" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full max-w-md mx-auto px-6">
        {/* Connection Visuals */}
        <div className="relative mb-10 w-full flex justify-center items-center h-48">
          <div className="absolute w-48 h-48 bg-primary/30 rounded-full blur-[60px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute w-32 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0" />

          {/* Left Image - My item */}
          <div className="relative z-10 animate-float">
            <div className="w-32 h-32 rounded-full border-4 border-background overflow-hidden shadow-2xl ring-2 ring-primary/50 translate-x-4">
              {myImage ? (
                <img src={myImage} alt={myItem.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-card flex items-center justify-center text-2xl">📦</div>
              )}
            </div>
          </div>

          {/* Center Match Icon */}
          <div className="absolute z-30 bg-primary text-primary-foreground rounded-full p-2 border-4 border-background shadow-lg neon-glow scale-125">
            <Handshake className="h-6 w-6" />
          </div>

          {/* Right Image - Their item */}
          <div className="relative z-20 animate-float-delayed">
            <div className="w-32 h-32 rounded-full border-4 border-background overflow-hidden shadow-2xl ring-2 ring-primary/50 -translate-x-4">
              {theirImage ? (
                <img src={theirImage} alt={theirItem.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-card flex items-center justify-center text-2xl">📦</div>
              )}
            </div>
          </div>
        </div>

        {/* Text Content */}
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight leading-tight drop-shadow-lg">
            Hype <br />
            <span className="text-primary text-glow">Confirmado!</span>
          </h1>
          <p className="text-foreground/70 text-base font-normal leading-relaxed max-w-xs mx-auto">
            Você e <span className="text-primary font-semibold">{match.other_user.display_name || "alguém"}</span> têm interesse em trocar itens.
          </p>
          {/* Matched Asset Detail */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-foreground/5 rounded-full border border-foreground/5 mt-2">
            <span className="text-foreground text-xs font-medium">{myItem.name}</span>
            <svg className="h-3 w-3 text-primary mx-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 16l5-5-5-5M17 8l-5 5 5 5" />
            </svg>
            <span className="text-foreground text-xs font-medium">{theirItem.name}</span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-6 pb-8 w-full max-w-md mx-auto relative z-10 flex flex-col gap-4">
        <NeonButton variant="primary" icon={MessageSquare} iconPosition="left" onClick={handleStartChat} className="shadow-[0_0_20px_hsl(184_100%_50%/0.4)] hover:shadow-[0_0_30px_hsl(184_100%_50%/0.6)]">
          Iniciar conversa
        </NeonButton>
        <NeonButton variant="ghost" size="sm" onClick={() => navigate("/explorar")}>
          Ver mais trocas
        </NeonButton>
      </div>

      {/* Rating Dialog */}
      {user && matchId && otherUserId && (
        <RatingDialog
          open={showRating}
          onClose={() => setShowRating(false)}
          matchId={matchId}
          raterId={user.id}
          ratedId={otherUserId}
          ratedName={match.other_user.display_name || "Usuário"}
        />
      )}
    </div>
  );
};

export default Match;
