import { MapPin, Package, Star, ChevronRight, Shield, Repeat } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserRating } from "@/hooks/useRatings";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatValue, translateCondition } from "@/lib/utils";

const getTimeSince = (dateStr: string | null | undefined) => {
  if (!dateStr) return null;
  const created = new Date(dateStr);
  const now = new Date();
  const months = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 30));
  if (months < 1) return "Novo membro";
  if (months === 1) return "Há 1 mês";
  if (months < 12) return `Há ${months} meses`;
  const years = Math.floor(months / 12);
  return years === 1 ? "Há 1 ano" : `Há ${years} anos`;
};

export const CardDetailContent = ({ item }: { item: any }) => {
  const navigate = useNavigate();
  const ownerProfile = item?.profiles as any;
  const conditionLabel = translateCondition(item?.condition);
  const { data: rating } = useUserRating(ownerProfile?.user_id);

  const { data: tradeCount = 0 } = useQuery({
    queryKey: ["user-trade-count", ownerProfile?.user_id],
    queryFn: async () => {
      const uid = ownerProfile?.user_id;
      if (!uid) return 0;
      const { count } = await supabase
        .from("matches")
        .select("id", { count: "exact", head: true })
        .eq("status", "accepted")
        .or(`user_a_id.eq.${uid},user_b_id.eq.${uid}`);
      return count || 0;
    },
    enabled: !!ownerProfile?.user_id,
  });

  const memberSince = getTimeSince(ownerProfile?.created_at);

  return (
    <div className="space-y-4 px-4 pb-6 pt-2">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-2xl font-extrabold text-on-media tracking-tight drop-shadow-md">
          {formatValue(item.market_value)}
        </span>
        <span className="px-2.5 py-0.5 rounded-full bg-on-media/20 border border-on-media/20 text-on-media text-[10px] font-bold tracking-[0.1em] uppercase">
          {item.category}
        </span>
        {conditionLabel && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-on-media/10 text-on-media/70 text-[10px] font-bold uppercase">
            <Package className="h-3 w-3" />
            {conditionLabel}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <MapPin className="h-3.5 w-3.5 text-on-media/50" />
        <span className="text-on-media/70 text-sm">
          {item.location || ownerProfile?.location || "Local não informado"}
        </span>
      </div>

      {item.description && (
        <div>
          <h3 className="text-[10px] font-bold text-on-media/40 uppercase tracking-widest mb-1.5">
            Descrição
          </h3>
          <p className="text-on-media/80 text-sm leading-relaxed">{item.description}</p>
        </div>
      )}

      {(item.margin_down > 0 || item.margin_up > 0) && (
        <div>
          <h3 className="text-[10px] font-bold text-on-media/40 uppercase tracking-widest mb-1.5">
            Aceita trocar por
          </h3>
          <p className="text-on-media/70 text-sm">
            Itens de {formatValue(Math.round(item.market_value * (1 - (item.margin_down || 0) / 100)))} até {formatValue(Math.round(item.market_value * (1 + (item.margin_up || 0) / 100)))}
          </p>
        </div>
      )}

      {ownerProfile && (
        <div>
          <h3 className="text-[10px] font-bold text-on-media/40 uppercase tracking-widest mb-2">
            Anunciante
          </h3>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/usuario/${ownerProfile.user_id}`);
            }}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-on-media/10 border border-on-media/10 hover:border-on-media/20 transition-all group"
          >
            {ownerProfile.avatar_url ? (
              <img
                src={ownerProfile.avatar_url}
                alt=""
                className="h-11 w-11 rounded-full object-cover border-2 border-on-media/20"
              />
            ) : (
              <div className="h-11 w-11 rounded-full bg-on-media/15 flex items-center justify-center border-2 border-on-media/20">
                <span className="text-base font-bold text-on-media/50">
                  {(ownerProfile.display_name || "?")[0]?.toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 text-left">
              <p className="text-on-media font-bold text-sm">
                {ownerProfile.display_name || "Usuário"}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-semibold text-yellow-400">{rating.average}</span>
                    <span className="text-[10px] text-on-media/40">({rating.count})</span>
                  </div>
                )}
                {tradeCount > 0 && (
                  <div className="flex items-center gap-1">
                    <Repeat className="h-3 w-3 text-on-media/40" />
                    <span className="text-[10px] text-on-media/50">
                      {tradeCount} {tradeCount === 1 ? "troca" : "trocas"}
                    </span>
                  </div>
                )}
                {memberSince && (
                  <div className="flex items-center gap-1">
                    <Shield className="h-3 w-3 text-on-media/40" />
                    <span className="text-[10px] text-on-media/50">{memberSince}</span>
                  </div>
                )}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-on-media/20 group-hover:text-on-media/50 transition-colors" />
          </button>
        </div>
      )}
    </div>
  );
};
