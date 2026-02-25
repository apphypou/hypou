import { useState, useRef, type ReactNode } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Loader2 } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
}

const THRESHOLD = 80;

const PullToRefresh = ({ onRefresh, children, className }: PullToRefreshProps) => {
  const [refreshing, setRefreshing] = useState(false);
  const pullY = useMotionValue(0);
  const spinnerOpacity = useTransform(pullY, [0, THRESHOLD * 0.5, THRESHOLD], [0, 0.5, 1]);
  const spinnerScale = useTransform(pullY, [0, THRESHOLD], [0.5, 1]);
  const startY = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollRef.current && scrollRef.current.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
    } else {
      startY.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null || refreshing) return;
    const delta = Math.max(0, e.touches[0].clientY - startY.current);
    pullY.set(Math.min(delta * 0.5, THRESHOLD * 1.5));
  };

  const handleTouchEnd = async () => {
    if (startY.current === null) return;
    if (pullY.get() >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      pullY.set(THRESHOLD * 0.6);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
    pullY.set(0);
    startY.current = null;
  };

  return (
    <div className={className} style={{ position: "relative" }}>
      <motion.div
        className="absolute top-0 left-0 right-0 flex items-center justify-center z-50 pointer-events-none"
        style={{ opacity: spinnerOpacity, scale: spinnerScale, height: 48 }}
      >
        <Loader2 className={`h-6 w-6 text-primary ${refreshing ? "animate-spin" : ""}`} />
      </motion.div>
      <div
        ref={scrollRef}
        className="h-full overflow-y-auto no-scrollbar"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <motion.div style={{ y: pullY }}>
          {children}
        </motion.div>
      </div>
    </div>
  );
};

export default PullToRefresh;
