import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ScreenLayoutProps {
  children: ReactNode;
  className?: string;
  edgeToEdgeTop?: boolean;
}

const ScreenLayout = ({ children, className, edgeToEdgeTop = false }: ScreenLayoutProps) => {
  return (
    <div
      className={cn(
        "relative flex flex-col h-[100dvh] bg-background text-foreground overflow-hidden font-display antialiased",
        className
      )}
      style={{
        paddingTop: edgeToEdgeTop ? 0 : "var(--safe-area-top)",
        paddingLeft: "var(--safe-area-left)",
        paddingRight: "var(--safe-area-right)",
      }}
    >
      {children}
    </div>
  );
};

export default ScreenLayout;
