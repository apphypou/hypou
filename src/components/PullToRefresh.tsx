import { useRef, useState, type CSSProperties, type ReactNode, type TouchEvent } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Loader2 } from "lucide-react";
import {
  findScrollableAncestor,
  getPullDirection,
  hasOpenRefreshBlocker,
  isPullRefreshExcluded,
  isScrollAtTop,
  PULL_THRESHOLD,
  type PullDirection,
} from "@/lib/pullToRefresh";

interface PullToRefreshProps {
  enabled: boolean;
  onRefresh: () => Promise<unknown>;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

const PullToRefresh = ({ enabled, onRefresh, children, className, style }: PullToRefreshProps) => {
  const [refreshing, setRefreshing] = useState(false);
  const refreshingRef = useRef(false);
  const pullY = useMotionValue(0);
  const spinnerOpacity = useTransform(pullY, [0, PULL_THRESHOLD * 0.5, PULL_THRESHOLD], [0, 0.5, 1]);
  const spinnerScale = useTransform(pullY, [0, PULL_THRESHOLD], [0.5, 1]);
  const rootRef = useRef<HTMLDivElement>(null);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const directionRef = useRef<PullDirection>("pending");
  const scrollElementRef = useRef<HTMLElement | null>(null);

  const resetGesture = () => {
    pullY.set(0);
    startPointRef.current = null;
    directionRef.current = "pending";
    scrollElementRef.current = null;
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (!enabled || refreshingRef.current || hasOpenRefreshBlocker() || isPullRefreshExcluded(event.target)) {
      resetGesture();
      return;
    }

    const scrollElement = findScrollableAncestor(event.target, rootRef.current);
    if (!isScrollAtTop(scrollElement)) {
      resetGesture();
      return;
    }

    const touch = event.touches[0];
    startPointRef.current = { x: touch.clientX, y: touch.clientY };
    scrollElementRef.current = scrollElement;
    directionRef.current = "pending";
  };

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    const startPoint = startPointRef.current;
    if (!startPoint || refreshingRef.current) return;

    const touch = event.touches[0];
    const deltaX = touch.clientX - startPoint.x;
    const deltaY = touch.clientY - startPoint.y;

    if (directionRef.current === "pending") {
      directionRef.current = getPullDirection(deltaX, deltaY);
    }

    if (directionRef.current !== "vertical" || !isScrollAtTop(scrollElementRef.current)) return;
    pullY.set(Math.min(deltaY * 0.5, PULL_THRESHOLD * 1.5));
  };

  const handleTouchEnd = async () => {
    if (!startPointRef.current) return;
    const shouldRefresh = directionRef.current === "vertical" && pullY.get() >= PULL_THRESHOLD;

    if (!shouldRefresh || refreshingRef.current) {
      resetGesture();
      return;
    }

    refreshingRef.current = true;
    setRefreshing(true);
    pullY.set(PULL_THRESHOLD * 0.6);

    try {
      await onRefresh();
    } catch {
      // Existing query error states remain responsible for user-facing feedback.
    } finally {
      refreshingRef.current = false;
      setRefreshing(false);
      resetGesture();
    }
  };

  return (
    <div
      ref={rootRef}
      data-testid="pull-to-refresh-root"
      className={className}
      style={style}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={resetGesture}
    >
      <motion.div
        data-testid="pull-to-refresh-indicator"
        data-refreshing={refreshing}
        className="pointer-events-none absolute left-0 right-0 z-[60] flex h-12 items-center justify-center"
        style={{
          top: "var(--safe-area-top)",
          opacity: refreshing ? 1 : spinnerOpacity,
          scale: spinnerScale,
        }}
      >
        <Loader2 className={`h-6 w-6 text-primary ${refreshing ? "animate-spin" : ""}`} />
      </motion.div>

      <motion.div className="flex min-h-0 flex-1 flex-col" style={{ y: pullY }}>
        {children}
      </motion.div>
    </div>
  );
};

export default PullToRefresh;
