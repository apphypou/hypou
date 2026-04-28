import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon: LucideIcon;
  rightSlot?: ReactNode;
}

const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ icon: Icon, rightSlot, className, ...props }, ref) => {
    return (
      <div className="relative group">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <input
          ref={ref}
          className={cn(
            "w-full h-14 pl-12 rounded-2xl bg-foreground/[0.04] border border-foreground/10 text-foreground text-sm placeholder:text-muted-foreground/80 focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/40 focus:bg-foreground/[0.06] transition-all",
            rightSlot ? "pr-12" : "pr-5",
            className
          )}
          {...props}
        />
        {rightSlot && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div>
        )}
      </div>
    );
  }
);

AuthInput.displayName = "AuthInput";

export default AuthInput;
