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
  const dislikeBtnScale = useTransform(x, [-150, 0, 150], [1.18, 1, 0.92]);
  const likeBtnScale = useTransform(x, [-150, 0, 150], [0.92, 1, 1.18]);

  const dislikeBtnBg = useTransform(
    x,
    [-60, -10, 0],
    [
      "hsl(var(--flop))",
      "hsl(var(--flop))",
      "hsl(var(--glass-surface))",
    ]
  );
  const likeBtnBg = useTransform(
    x,
    [0, 10, 60],
    [
      "hsl(var(--glass-surface))",
      "hsl(var(--hype))",
      "hsl(var(--hype))",
    ]
  );

  const dislikeBtnShadow = useTransform(
    x,
    [-60, 0],
    [
      "0 0 40px hsl(var(--flop-glow) / 0.8), 0 0 80px hsl(var(--flop-glow) / 0.45)",
      "0 4px 12px hsl(0 0% 0% / 0.25)",
    ]
  );
  const likeBtnShadow = useTransform(
    x,
    [0, 60],
    [
      "0 4px 12px hsl(0 0% 0% / 0.25)",
      "0 0 40px hsl(var(--hype-glow) / 0.8), 0 0 80px hsl(var(--hype-glow) / 0.45)",
    ]
  );

  const dislikeIconColor = useTransform(
    x,
    [-60, -10, 0],
    ["hsl(var(--flop-foreground))", "hsl(var(--flop-foreground))", "hsl(var(--flop))"]
  );
  const likeIconColor = useTransform(
    x,
    [0, 10, 60],
    ["hsl(var(--hype))", "hsl(0 0% 100%)", "hsl(0 0% 100%)"]
  );

  return (
    <div className="mt-6 flex items-center justify-center gap-8 pointer-events-auto">
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
          background: dislikeBtnBg,
          boxShadow: dislikeBtnShadow,
          color: dislikeIconColor,
        }}
        className="h-16 w-16 rounded-full border border-white/15 backdrop-blur-xl flex items-center justify-center transition-colors disabled:opacity-50"
      >
        <ThumbsDown
          className="h-7 w-7"
          strokeWidth={2.4}
          fill="currentColor"
          fillOpacity={0.15}
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
          background: likeBtnBg,
          boxShadow: likeBtnShadow,
          color: likeIconColor,
        }}
        className="h-16 w-16 rounded-full border border-white/15 backdrop-blur-xl flex items-center justify-center disabled:opacity-50"
      >
        <ThumbsUp
          className="h-7 w-7"
          strokeWidth={2.4}
          fill="currentColor"
          fillOpacity={0.15}
        />
      </motion.button>
    </div>
  );
};
