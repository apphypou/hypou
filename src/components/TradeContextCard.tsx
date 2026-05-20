import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import ItemPreviewDialog from "@/components/ItemPreviewDialog";

interface TradeItem {
  id?: string;
  name: string;
  item_images?: { image_url: string; position: number }[];
}

interface TradeContextCardProps {
  myItem: TradeItem | null;
  otherItem: TradeItem | null;
  matchStatus: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  proposal: { label: "Pendente ⏳", className: "bg-primary/10 text-primary border-primary/20" },
  accepted: { label: "Em negociação 🤝", className: "bg-primary/10 text-primary border-primary/20" },
  completed: { label: "Troca concluída ✅", className: "bg-success/10 text-success border-success/20" },
  rejected: { label: "Troca não realizada ❌", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const getItemImage = (item: TradeItem | null) => {
  if (!item?.item_images?.length) return null;
  const sorted = [...item.item_images].sort((a, b) => a.position - b.position);
  return sorted[0]?.image_url;
};

const TradeContextCard = ({ myItem, otherItem, matchStatus }: TradeContextCardProps) => {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const status = statusConfig[matchStatus] || statusConfig.proposal;
  const myImg = getItemImage(myItem);
  const otherImg = getItemImage(otherItem);

  const openItem = (item: TradeItem | null) => {
    if (item?.id) setPreviewId(item.id);
  };

  return (
    <>
    <div className="flex items-center gap-3 px-4 py-3 border-b border-foreground/5 bg-card/50 shrink-0">
      {/* My item */}
      <button
        type="button"
        onClick={() => openItem(myItem)}
        disabled={!myItem?.id}
        className="flex-1 flex items-center gap-2 min-w-0 rounded-lg -mx-1 px-1 py-0.5 transition-colors hover:bg-foreground/5 active:bg-foreground/10 disabled:opacity-100 disabled:cursor-default text-left"
      >
        {myImg ? (
          <img src={myImg} alt="" className="h-10 w-10 rounded-lg object-cover border border-foreground/10 shrink-0" />
        ) : (
          <div className="h-10 w-10 rounded-lg bg-muted border border-foreground/10 shrink-0" />
        )}
        <span className="text-xs font-semibold text-foreground truncate">{myItem?.name || "Meu item"}</span>
      </button>

      {/* Swap icon + status badge */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        <ArrowLeftRight className="h-4 w-4 text-primary" />
        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${status.className}`}>
          {status.label}
        </span>
      </div>

      {/* Other item */}
      <button
        type="button"
        onClick={() => openItem(otherItem)}
        disabled={!otherItem?.id}
        className="flex-1 flex items-center gap-2 min-w-0 justify-end rounded-lg -mx-1 px-1 py-0.5 transition-colors hover:bg-foreground/5 active:bg-foreground/10 disabled:opacity-100 disabled:cursor-default text-right"
      >
        <span className="text-xs font-semibold text-foreground truncate text-right">{otherItem?.name || "Item"}</span>
        {otherImg ? (
          <img src={otherImg} alt="" className="h-10 w-10 rounded-lg object-cover border border-foreground/10 shrink-0" />
        ) : (
          <div className="h-10 w-10 rounded-lg bg-muted border border-foreground/10 shrink-0" />
        )}
      </button>
    </div>
    <ItemPreviewDialog itemId={previewId} open={!!previewId} onOpenChange={(o) => !o && setPreviewId(null)} />
    </>
  );
};

export default TradeContextCard;
