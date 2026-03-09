import { ArrowLeftRight, Info } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { motion } from "framer-motion";

interface TradeRangeCardProps {
  valueCents: number;
  marginDown: number;
  marginUp: number;
  onMarginDownChange: (v: number) => void;
  onMarginUpChange: (v: number) => void;
}

const formatCentsDisplay = (cents: number): string => {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const TradeRangeCard = ({
  valueCents,
  marginDown,
  marginUp,
  onMarginDownChange,
  onMarginUpChange,
}: TradeRangeCardProps) => {
  const minValue = Math.round(valueCents * (1 - marginDown / 100));
  const maxValue = Math.round(valueCents * (1 + marginUp / 100));

  const sliderValue = [50 - marginDown, 50 + marginUp];

  const handleSliderChange = (values: number[]) => {
    const newDown = Math.max(0, Math.min(50, 50 - values[0]));
    const newUp = Math.max(0, Math.min(50, values[1] - 50));
    onMarginDownChange(newDown);
    onMarginUpChange(newUp);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl bg-card border border-foreground/5 p-6 mb-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <ArrowLeftRight className="h-5 w-5 text-primary" />
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Faixa de Troca
        </span>
      </div>

      <p className="text-sm text-muted-foreground mb-5">
        Aceito trocar por itens que valem entre:
      </p>

      {/* Values display */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="text-center min-w-0 flex-1">
          <span className="text-xl font-bold text-foreground truncate block">{formatCentsDisplay(minValue)}</span>
          <p className="text-xs text-muted-foreground mt-1">mínimo</p>
        </div>
        <div className="flex items-center justify-center shrink-0 px-1">
          <ArrowLeftRight className="h-4 w-4 text-primary" />
        </div>
        <div className="text-center min-w-0 flex-1">
          <span className="text-xl font-bold text-foreground truncate block">{formatCentsDisplay(maxValue)}</span>
          <p className="text-xs text-muted-foreground mt-1">máximo</p>
        </div>
      </div>

      {/* Range slider */}
      <div className="px-1 mb-3">
        <Slider
          value={sliderValue}
          onValueChange={handleSliderChange}
          min={0}
          max={100}
          step={1}
          minStepsBetweenThumbs={0}
        />
      </div>

      {/* Simple hint instead of percentages */}
      <p className="text-xs text-muted-foreground text-center">
        Arraste para ajustar a faixa de valor aceita
      </p>

      {/* Help text */}
      <div className="flex items-start gap-3 rounded-xl bg-background/50 border border-foreground/5 p-3 mt-4">
        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Você receberá propostas de troca apenas de itens dentro desta faixa de valor.
        </p>
      </div>
    </motion.div>
  );
};

export default TradeRangeCard;
