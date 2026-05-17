import { type LucideIcon } from "lucide-react";
import { type ReactNode, type ButtonHTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const neonButtonVariants = cva(
  "flex w-full items-center justify-center tracking-wide disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "group relative overflow-hidden rounded-full bg-primary text-primary-foreground neon-glow-hover transition-all duration-300 active:scale-[0.98]",
        outline:
          "rounded-full border border-foreground/20 bg-foreground/5 text-foreground backdrop-blur-sm transition-all duration-300 active:scale-[0.98] hover:bg-foreground/10 hover:border-foreground/40",
        ghost: "rounded-full text-muted-foreground hover:text-foreground transition-colors",
      },
      size: {
        sm: "h-10 px-5 text-sm font-semibold",
        md: "h-14 px-8 text-base font-bold",
        lg: "h-14 px-8 text-lg font-bold",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface NeonButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof neonButtonVariants> {
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  children: ReactNode;
}

const NeonButton = forwardRef<HTMLButtonElement, NeonButtonProps>(
  (
    { variant = "primary", size = "md", icon: Icon, iconPosition = "right", children, className, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(neonButtonVariants({ variant, size }), className)}
        {...props}
      >
        {variant === "primary" && (
          <div className="absolute inset-0 bg-on-media/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
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

export { neonButtonVariants };
export default NeonButton;
