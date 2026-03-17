import { type LucideIcon } from "lucide-react";
import { type ReactNode, type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  children: ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "group relative overflow-hidden rounded-full bg-primary text-primary-foreground neon-glow-hover transition-all duration-300 active:scale-[0.98]",
  outline:
    "rounded-full border border-foreground/20 bg-foreground/5 text-foreground backdrop-blur-sm transition-all duration-300 active:scale-[0.98] hover:bg-foreground/10 hover:border-foreground/40",
  ghost:
    "rounded-full text-muted-foreground hover:text-foreground transition-colors",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-10 px-5 text-sm font-semibold",
  md: "h-14 px-8 text-base font-bold",
  lg: "h-14 px-8 text-lg font-bold",
};

const NeonButton = forwardRef<HTMLButtonElement, NeonButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      icon: Icon,
      iconPosition = "right",
      children,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "flex w-full items-center justify-center tracking-wide",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {variant === "primary" && (
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
        )}
        <span className="relative flex items-center gap-2">
          {Icon && iconPosition === "left" && <Icon className="h-5 w-5" />}
          {children}
          {Icon && iconPosition === "right" && <Icon className="h-5 w-5" />}
        </span>
      </button>
    );
  }
);

NeonButton.displayName = "NeonButton";

export default NeonButton;
