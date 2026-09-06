import { motion, useTransform, type MotionValue } from "framer-motion";
import { ThumbsDown, ThumbsUp } from "lucide-react";

interface SwipeActionButtonsProps {
  x: MotionValue<number>;
  disabled?: boolean;
  standby?: boolean;
  onDislike: () => void;
  onLike: () => void;
}

/**
 * Hypou / Flopou action buttons.
 * Visual states driven by the parent card's drag MotionValue (`x`).
 * Tokens: --flop / --flop-glow / --hype / --hype-glow / --glass-surface.
 */
export const SwipeActionButtons = ({
  x,
  disabled,
  standby,
  onDislike,
  onLike,
}: SwipeActionButtonsProps) => {
  const disabledClass = disabled ? "opacity-50" : "";
  const dislikeBtnScale = useTransform(x, [-150, 0, 150], [1.18, 1, 0.92]);
  const likeBtnScale = useTransform(x, [-150, 0, 150], [0.92, 1, 1.18]);

  const dislikeHighlight = useTransform(x, [-60, -6], [1, 0]);
  const likeHighlight = useTransform(x, [6, 60], [0, 1]);

  return (
    <div className="mt-3 flex items-center justify-center gap-7 pointer-events-auto">
      <motion.button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDislike();
        }}
        disabled={disabled || standby}
        aria-label="Flopou"
        whileTap={{ scale: 0.88 }}
        style={{
          scale: dislikeBtnScale,
          background: "rgba(26, 30, 31, 0.72)",
          color: "hsl(var(--flop))",
        }}
        className={`relative h-14 w-14 rounded-full border border-white/[0.13] flex items-center justify-center ${disabledClass}`}
      >
        <motion.span aria-hidden className="absolute inset-0 flex items-center justify-center rounded-full bg-flop text-flop-foreground" style={{ opacity: dislikeHighlight }}>
          <ThumbsDown className="h-6 w-6" strokeWidth={2.4} />
        </motion.span>
        <ThumbsDown
          className="h-6 w-6"
          strokeWidth={2.4}
          fill="none"
        />
      </motion.button>
      <motion.button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onLike();
        }}
        disabled={disabled || standby}
        aria-label="Hypou"
        whileTap={{ scale: 0.88 }}
        style={{
          scale: likeBtnScale,
          background: "rgba(26, 30, 31, 0.72)",
          color: "hsl(var(--hype))",
        }}
        className={`relative h-14 w-14 rounded-full border border-white/[0.13] flex items-center justify-center ${disabledClass}`}
      >
        <motion.span aria-hidden className="absolute inset-0 flex items-center justify-center rounded-full bg-hype text-white" style={{ opacity: likeHighlight }}>
          <ThumbsUp className="h-6 w-6" strokeWidth={2.4} />
        </motion.span>
        <ThumbsUp
          className="h-6 w-6"
          strokeWidth={2.4}
          fill="none"
        />
      </motion.button>
    </div>
  );
};
