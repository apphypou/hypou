import { motion, useTransform, type MotionValue } from "framer-motion";

interface SwipeOverlaysProps {
  x: MotionValue<number>;
}

/**
 * Drag-driven feedback overlays: edge glow + HYPOU/FLOPOU stamps.
 * Uses --hype / --flop tokens.
 */
export const SwipeOverlays = ({ x }: SwipeOverlaysProps) => {
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const dislikeOpacity = useTransform(x, [-100, 0], [1, 0]);
  const likeStampScale = useTransform(x, [0, 100], [0.5, 1.0]);
  const dislikeStampScale = useTransform(x, [-100, 0], [1.0, 0.5]);
  const likeGlowOpacity = useTransform(x, [0, 60, 140], [0, 0.25, 0.7]);
  const dislikeGlowOpacity = useTransform(x, [-140, -60, 0], [0.7, 0.25, 0]);

  return (
    <>
      <motion.div
        className="absolute inset-0 z-40 rounded-[1.5rem] pointer-events-none"
        style={{
          opacity: likeGlowOpacity,
          boxShadow:
            "inset 0 0 40px hsl(var(--hype) / 0.4), 0 0 30px hsl(var(--hype) / 0.3)",
          border: "2px solid hsl(var(--hype) / 0.6)",
        }}
      />
      <motion.div
        className="absolute inset-0 z-40 rounded-[1.5rem] pointer-events-none"
        style={{
          opacity: dislikeGlowOpacity,
          boxShadow:
            "inset 0 0 40px hsl(var(--flop) / 0.4), 0 0 30px hsl(var(--flop) / 0.3)",
          border: "2px solid hsl(var(--flop) / 0.6)",
        }}
      />

      <motion.div
        className="absolute inset-0 z-50 rounded-[1.5rem] pointer-events-none flex items-center justify-center"
        style={{ opacity: likeOpacity }}
      >
        <motion.span
          className="text-success text-4xl font-black rotate-[-15deg] border-[3px] border-success px-4 py-2 rounded-xl"
          style={{
            textShadow: "0 0 20px hsl(var(--hype) / 0.6)",
            scale: likeStampScale,
          }}
        >
          HYPOU
        </motion.span>
      </motion.div>
      <motion.div
        className="absolute inset-0 z-50 rounded-[1.5rem] pointer-events-none flex items-center justify-center"
        style={{ opacity: dislikeOpacity }}
      >
        <motion.span
          className="text-danger text-4xl font-black rotate-[15deg] border-[3px] border-danger px-4 py-2 rounded-xl"
          style={{
            textShadow: "0 0 20px hsl(var(--flop) / 0.6)",
            scale: dislikeStampScale,
          }}
        >
          FLOPOU
        </motion.span>
      </motion.div>
    </>
  );
};
