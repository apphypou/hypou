import { cn } from "@/lib/utils";
import { type ElementType } from "react";

interface HypouLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Render as a different HTML element (e.g. "h1" for SEO on main screens). Defaults to "span". */
  as?: ElementType;
}

const sizeStyles = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-4xl",
};

const HypouLogo = ({ size = "md", className, as: Tag = "span" }: HypouLogoProps) => {
  return (
    <Tag
      className={cn(
        "font-display font-extrabold tracking-tight select-none inline-block",
        sizeStyles[size],
        className
      )}
    >
      <span className="text-foreground">hyp</span>
      <span className="text-primary text-glow">ou</span>
    </Tag>
  );
};

export default HypouLogo;
