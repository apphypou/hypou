import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { formatValue } from "@/lib/utils";
import { cdnFull } from "@/lib/imageUrl";

interface ItemPreviewDialogProps {
  itemId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const useItemPreview = (itemId: string | null) =>
  useQuery({
    queryKey: ["item-preview", itemId],
    enabled: !!itemId,
    queryFn: async () => {
      if (!itemId) return null;
      const { data, error } = await supabase
        .from("items")
        .select("id, name, description, category, condition, market_value, location, item_images(image_url, position)")
        .eq("id", itemId)
        .single();
      if (error) throw error;
      return data;
    },
  });

const ItemPreviewDialog = ({ itemId, open, onOpenChange }: ItemPreviewDialogProps) => {
  const { data: item, isLoading } = useItemPreview(open ? itemId : null);
  const [idx, setIdx] = useState(0);

  const images = (item?.item_images || [])
    .slice()
    .sort((a: any, b: any) => a.position - b.position)
    .map((i: any) => i.image_url);

  const current = images[idx];
  const hasMany = images.length > 1;

  const prev = () => setIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setIdx((i) => (i + 1) % images.length);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setIdx(0);
      }}
    >
      <DialogContent
        className="max-w-sm w-[92vw] p-0 overflow-hidden rounded-3xl border border-foreground/10 bg-card/70 backdrop-blur-2xl shadow-2xl"
      >
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-3 right-3 z-20 h-8 w-8 rounded-full bg-background/60 backdrop-blur-xl border border-foreground/10 flex items-center justify-center text-foreground hover:bg-background/80 transition-colors"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Image */}
        <div className="relative aspect-square w-full bg-muted overflow-hidden">
          {current ? (
            <img src={current} alt={item?.name || ""} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-foreground/40 text-xs">
              {isLoading ? "Carregando..." : "Sem foto"}
            </div>
          )}

          {hasMany && (
            <>
              <button
                onClick={prev}
                className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/60 backdrop-blur-xl border border-foreground/10 flex items-center justify-center text-foreground hover:bg-background/80 transition-colors"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={next}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/60 backdrop-blur-xl border border-foreground/10 flex items-center justify-center text-foreground hover:bg-background/80 transition-colors"
                aria-label="Próximo"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === idx ? "w-5 bg-primary" : "w-1.5 bg-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Info */}
        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-bold text-foreground leading-tight">
              {item?.name || (isLoading ? "Carregando..." : "Item")}
            </h2>
            {item?.market_value ? (
              <span className="text-sm font-bold text-primary shrink-0">
                {formatValue(item.market_value)}
              </span>
            ) : null}
          </div>

          {(item?.category || item?.condition || item?.location) && (
            <div className="flex flex-wrap gap-1.5">
              {item?.category && (
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-foreground/5 border border-foreground/10 text-foreground/70">
                  {item.category}
                </span>
              )}
              {item?.condition && (
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-foreground/5 border border-foreground/10 text-foreground/70">
                  {item.condition}
                </span>
              )}
              {item?.location && (
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-foreground/5 border border-foreground/10 text-foreground/70">
                  {item.location}
                </span>
              )}
            </div>
          )}

          {item?.description && (
            <p className="text-sm text-foreground/70 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
              {item.description}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ItemPreviewDialog;
