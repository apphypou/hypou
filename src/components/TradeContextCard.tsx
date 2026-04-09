import { ArrowLeftRight } from "lucide-react";
import { formatValue } from "@/lib/utils";

interface TradeItem {
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
  accepted: { label: "Aceita ✅", className: "bg-success/10 text-success border-success/20" },
  rejected: { label: "Recusada ❌", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const getItemImage = (item: TradeItem | null) => {
  if (!item?.item_images?.length) return null;
  const sorted = [...item.item_images].sort((a, b) => a.position - b.position);
  return sorted[0]?.image_url;
};

const TradeContextCard = ({ myItem, otherItem, matchStatus }: TradeContextCardProps) => {
  const status = statusConfig[matchStatus] || statusConfig.proposal;
  const myImg = getItemImage(myItem);
  const otherImg = getItemImage(otherItem);

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-foreground/5 bg-card/50 shrink-0">
      {/* My item */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        {myImg ? (
          <img src={myImg} alt="" className="h-10 w-10 rounded-lg object-cover border border-foreground/10 shrink-0" />
        ) : (
          <div className="h-10 w-10 rounded-lg bg-muted border border-foreground/10 shrink-0" />
        )}
        <span className="text-xs font-semibold text-foreground truncate">{myItem?.name || "Meu item"}</span>
      </div>

      {/* Swap icon + status badge */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        <ArrowLeftRight className="h-4 w-4 text-primary" />
        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${status.className}`}>
          {status.label}
        </span>
      </div>

      {/* Other item */}
      <div className="flex-1 flex items-center gap-2 min-w-0 justify-end">
        <span className="text-xs font-semibold text-foreground truncate text-right">{otherItem?.name || "Item"}</span>
        {otherImg ? (
          <img src={otherImg} alt="" className="h-10 w-10 rounded-lg object-cover border border-foreground/10 shrink-0" />
        ) : (
          <div className="h-10 w-10 rounded-lg bg-muted border border-foreground/10 shrink-0" />
        )}
      </div>
    </div>
  );
};

export default TradeContextCard;
