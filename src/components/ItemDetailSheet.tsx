import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { MapPin, Package, Star, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserRating } from "@/hooks/useRatings";

const formatValue = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

const CONDITION_MAP: Record<string, string> = {
  used: "Usado", USED: "Usado",
  new: "Novo", NEW: "Novo",
  like_new: "Semi-novo", LIKE_NEW: "Semi-novo",
  "semi-novo": "Semi-novo", "Semi-novo": "Semi-novo",
};

interface ItemDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any;
}

const ItemDetailSheet = ({ open, onOpenChange, item }: ItemDetailSheetProps) => {
  const navigate = useNavigate();
  const ownerProfile = item?.profiles as any;
  const conditionLabel = item?.condition ? (CONDITION_MAP[item.condition] || item.condition) : null;
  const images = item?.item_images || [];
  const { data: rating } = useUserRating(ownerProfile?.user_id);

  if (!item) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-[1.5rem] max-h-[85vh] overflow-y-auto no-scrollbar bg-background border-t border-border px-0 pb-safe">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-foreground/15" />
        </div>

        <SheetHeader className="px-5 pb-2">
          <SheetTitle className="text-left text-xl font-extrabold tracking-tight text-foreground">
            {item.name}
          </SheetTitle>
        </SheetHeader>

        <div className="px-5 space-y-5 pb-8">
          {/* Image gallery */}
          {images.length > 0 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5">
              {images.map((img: any, i: number) => (
                <img
                  key={i}
                  src={img.image_url}
                  alt={`${item.name} ${i + 1}`}
                  className="h-48 w-48 rounded-2xl object-cover flex-shrink-0 border border-border"
                />
              ))}
            </div>
          )}

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
                onClick={() => {
                  onOpenChange(false);
                  navigate(`/perfil/${ownerProfile.user_id}`);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all group"
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
      </SheetContent>
    </Sheet>
  );
};

export default ItemDetailSheet;
