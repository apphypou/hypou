import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ScreenLayoutProps {
  children: ReactNode;
  className?: string;
}

const ScreenLayout = ({ children, className }: ScreenLayoutProps) => {
  return (
    <div className={cn("relative flex flex-col h-[100dvh] bg-background text-foreground overflow-hidden font-display antialiased", className)}>
      {children}
    </div>
  );
};

export default ScreenLayout;
