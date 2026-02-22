import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  hoverable?: boolean;
  className?: string;
  onClick?: () => void;
}

const GlassCard = ({ children, hoverable = false, className, onClick }: GlassCardProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "glass-card rounded-[2rem] overflow-hidden transition-all duration-300",
        hoverable && "hover:border-primary/30 hover:shadow-[0_0_10px_hsl(184_100%_50%/0.1)]",
        className
      )}
    >
      {children}
    </div>
  );
};

export default GlassCard;
