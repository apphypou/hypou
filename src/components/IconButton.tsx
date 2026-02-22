import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  size?: "sm" | "md";
}

const sizeStyles = {
  sm: "h-10 w-10",
  md: "h-11 w-11",
};

const IconButton = ({ icon: Icon, size = "md", className, ...props }: IconButtonProps) => {
  return (
    <button
      className={cn(
        "flex items-center justify-center rounded-full bg-muted/50 border border-foreground/10 text-foreground/80 hover:bg-foreground/10 transition-all",
        sizeStyles[size],
        className
      )}
      {...props}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
};

export default IconButton;
