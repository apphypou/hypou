import { type LucideIcon } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const iconButtonVariants = cva(
  "flex items-center justify-center rounded-full border text-foreground/80 transition-all disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-muted/50 border-foreground/10 hover:bg-foreground/10",
        glass: "glass-button hover:bg-foreground/10",
        ghost: "border-transparent hover:bg-foreground/10",
      },
      size: {
        sm: "h-10 w-10",
        md: "h-11 w-11",
        lg: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  icon: LucideIcon;
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon: Icon, variant, size, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(iconButtonVariants({ variant, size }), className)}
        {...props}
      >
        <Icon className="h-5 w-5" />
      </button>
    );
  }
);

IconButton.displayName = "IconButton";

export { iconButtonVariants };
export default IconButton;
