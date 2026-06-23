import { useCallback, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import PullToRefresh from "@/components/PullToRefresh";

interface ScreenLayoutProps {
  children: ReactNode;
  className?: string;
  edgeToEdgeTop?: boolean;
  refreshable?: boolean;
  onRefresh?: () => Promise<unknown>;
}

const ScreenLayout = ({
  children,
  className,
  edgeToEdgeTop = false,
  refreshable = true,
  onRefresh,
}: ScreenLayoutProps) => {
  const queryClient = useQueryClient();
  const refreshActiveQueries = useCallback(
    () => queryClient.refetchQueries({ type: "active" }),
    [queryClient],
  );

  return (
    <PullToRefresh
      enabled={refreshable}
      onRefresh={onRefresh ?? refreshActiveQueries}
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
    </PullToRefresh>
  );
};

export default ScreenLayout;
