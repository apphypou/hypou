import { motion } from "framer-motion";
import { Apple, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface StoreBadgeProps {
  store: "apple" | "google";
  href: string;
  highlighted?: boolean;
  className?: string;
}

const StoreBadge = ({ store, href, highlighted, className }: StoreBadgeProps) => {
  const isApple = store === "apple";
  const Icon = isApple ? Apple : Play;
  const topLine = isApple ? "Baixar na" : "Disponível no";
  const bottomLine = isApple ? "App Store" : "Google Play";
  const ariaLabel = `Baixar Hypou na ${bottomLine}`;

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 380, damping: 22 }}
      className={cn(
        "group relative inline-flex items-center gap-3 rounded-2xl border px-5 py-3 backdrop-blur-2xl transition-colors",
        highlighted
          ? "border-primary/40 bg-primary/10 shadow-[0_0_40px_-10px_hsl(var(--primary)/0.5)]"
          : "border-foreground/10 bg-foreground/5 hover:border-foreground/20",
        className
      )}
    >
      <Icon
        className={cn(
          "h-7 w-7 shrink-0",
          isApple ? "fill-foreground text-foreground" : "fill-primary text-primary"
        )}
        strokeWidth={isApple ? 0 : 1.5}
      />
      <div className="text-left leading-tight">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{topLine}</p>
        <p className="text-base font-bold text-foreground">{bottomLine}</p>
      </div>
      {highlighted && (
        <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-primary/30" />
      )}
    </motion.a>
  );
};

export default StoreBadge;
