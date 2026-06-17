import { Images, TrendingUp } from "lucide-react";

interface PhotoSuccessHintProps {
  compact?: boolean;
}

const PhotoSuccessHint = ({ compact = false }: PhotoSuccessHintProps) => (
  <div
    className={`rounded-2xl border border-primary/20 bg-primary/[0.08] ${
      compact ? "px-3 py-2" : "px-4 py-3"
    } flex items-start gap-3`}
  >
    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
      {compact ? <Images className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
    </div>
    <div>
      <p className="text-sm font-bold text-foreground">Mais fotos, mais chances</p>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Adicione mais fotos para aumentar suas chances de conseguir um Hypou.
      </p>
    </div>
  </div>
);

export default PhotoSuccessHint;
