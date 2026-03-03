import { cn } from "@/lib/utils";

interface HypouLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeStyles = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-4xl",
};

const HypouLogo = ({ size = "md", className }: HypouLogoProps) => {
  return (
    <span
      className={cn(
        "font-display font-extrabold tracking-tight select-none",
        sizeStyles[size],
        className
      )}
    >
      <span className="text-foreground">hyp</span>
      <span className="text-primary text-glow">ou</span>
    </span>
  );
};

export default HypouLogo;
