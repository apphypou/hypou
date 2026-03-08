import { MapPin, Package, Star, ChevronRight, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserRating } from "@/hooks/useRatings";
import { motion, type PanInfo } from "framer-motion";
import { useCallback, useRef } from "react";

const formatValue = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

const CONDITION_MAP: Record<string, string> = {
  used: "Usado", USED: "Usado",
  new: "Novo", NEW: "Novo",
  like_new: "Semi-novo", LIKE_NEW: "Semi-novo",
  "semi-novo": "Semi-novo", "Semi-novo": "Semi-novo",
};

interface ItemDetailPanelProps {
  item: any;
  onCollapse: () => void;
}

const ItemDetailPanel = ({ item, onCollapse }: ItemDetailPanelProps) => {
  const navigate = useNavigate();
  const ownerProfile = item?.profiles as any;
  const conditionLabel = item?.condition ? (CONDITION_MAP[item.condition] || item.condition) : null;
  const images = item?.item_images || [];
  const { data: rating } = useUserRating(ownerProfile?.user_id);
  const touchStartRef = useRef<{ y: number; time: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = { y: e.touches[0].clientY, time: Date.now() };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    const dt = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;
    if (dy > 50 && dt < 400) {
      onCollapse();
    }
  }, [onCollapse]);

  if (!item) return null;

    return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full px-1 pb-6"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Collapse handle */}
      <button
        onClick={onCollapse}
        className="w-full flex justify-center items-center gap-1 py-3 text-muted-foreground"
      >
        <ChevronDown className="h-4 w-4" />
        <span className="text-[10px] font-bold uppercase tracking-widest">Recolher</span>
      </button>

      <div className="rounded-2xl bg-card border border-border p-4 space-y-5">

        {/* Price + tags */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-2xl font-extrabold text-primary tracking-tight">
            {formatValue(item.market_value)}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold tracking-[0.1em] uppercase">
            {item.category}
          </span>
          {conditionLabel && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-foreground/70 text-[10px] font-bold uppercase">
              <Package className="h-3 w-3" />
              {conditionLabel}
            </span>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground text-sm">
            {item.location || ownerProfile?.location || "Local não informado"}
          </span>
        </div>

        {/* Description */}
        {item.description && (
          <div>
            <h3 className="text-xs font-bold text-foreground/50 uppercase tracking-widest mb-2">
              Descrição
            </h3>
            <p className="text-foreground/80 text-sm leading-relaxed">
              {item.description}
            </p>
          </div>
        )}

        {/* Margin info */}
        {(item.margin_down > 0 || item.margin_up > 0) && (
          <div>
            <h3 className="text-xs font-bold text-foreground/50 uppercase tracking-widest mb-2">
              Faixa de Troca
            </h3>
            <p className="text-foreground/70 text-sm">
              {formatValue(item.market_value - (item.margin_down || 0))} — {formatValue(item.market_value + (item.margin_up || 0))}
            </p>
          </div>
        )}

        {/* Owner profile section */}
        {ownerProfile && (
          <div>
            <h3 className="text-xs font-bold text-foreground/50 uppercase tracking-widest mb-3">
              Anunciante
            </h3>
            <button
              onClick={() => navigate(`/perfil/${ownerProfile.user_id}`)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-background border border-border hover:border-primary/30 transition-all group"
            >
              {ownerProfile.avatar_url ? (
                <img
                  src={ownerProfile.avatar_url}
                  alt=""
                  className="h-12 w-12 rounded-full object-cover border-2 border-primary/20"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center border-2 border-primary/20">
                  <span className="text-lg font-bold text-foreground/30">
                    {(ownerProfile.display_name || "?")[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 text-left">
                <p className="text-foreground font-bold text-sm">
                  {ownerProfile.display_name || "Usuário"}
                </p>
                {ownerProfile.location && (
                  <p className="text-muted-foreground text-xs flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {ownerProfile.location}
                  </p>
                )}
                {rating && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="h-3 w-3 text-primary fill-primary" />
                    <span className="text-xs font-semibold text-primary">{rating.average}</span>
                    <span className="text-[10px] text-muted-foreground">({rating.count})</span>
                  </div>
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-foreground/20 group-hover:text-primary transition-colors" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ItemDetailPanel;
