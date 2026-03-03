import { useRef, useCallback, useEffect, useState } from "react";
import { type MotionValue, useMotionValueEvent } from "framer-motion";

interface SwipeToggleProps {
  onSwipe: (direction: "like" | "dislike") => void;
  disabled?: boolean;
  dragProgress?: MotionValue<number>;
}

const MAX_DRAG = 80;
const CENTER = MAX_DRAG / 2; // 40
const SNAP_THRESHOLD = 20; // trigger zone: < 20 = dislike, > 60 = like

const SwipeToggle = ({ onSwipe, disabled, dragProgress }: SwipeToggleProps) => {
  const isDragging = useRef(false);
  const startX = useRef(0);
  const basePos = useRef(CENTER);
  const [position, setPosition] = useState(CENTER);
  const [animating, setAnimating] = useState(false);
  const externalDriving = useRef(false);

  // Bidirectional progress from center
  const rightProgress = Math.max(0, (position - CENTER) / (MAX_DRAG - CENTER)); // 0..1 green
  const leftProgress = Math.max(0, (CENTER - position) / CENTER); // 0..1 red
  const neutralOpacity = Math.max(0, 1 - (leftProgress + rightProgress) * 3);

  // React to external card drag
  useMotionValueEvent(dragProgress ?? null as any, "change", (v: number) => {
    if (!dragProgress) return;
    if (isDragging.current) return;
    // Map card drag (-150..150) to toggle position (0..MAX_DRAG) centered at 40
    const mapped = CENTER + (v / 150) * CENTER;
    const clamped = Math.max(0, Math.min(MAX_DRAG, mapped));
    externalDriving.current = true;
    setAnimating(false);
    setPosition(clamped);
  });

  // When card drag ends, reset to center
  useEffect(() => {
    if (!dragProgress) return;
    const unsub = dragProgress.on("change", (v: number) => {
      if (externalDriving.current && Math.abs(v) < 1 && !isDragging.current) {
        externalDriving.current = false;
        setAnimating(true);
        setPosition(CENTER);
      }
    });
    return unsub;
  }, [dragProgress]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (disabled) return;
    isDragging.current = true;
    externalDriving.current = false;
    startX.current = e.clientX;
    basePos.current = position;
    setAnimating(false);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [disabled, position]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const walk = e.clientX - startX.current;
    const newPos = Math.max(0, Math.min(MAX_DRAG, basePos.current + walk * 0.8));
    setPosition(newPos);
  }, []);

  const handlePointerUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    setAnimating(true);

    if (position > MAX_DRAG - SNAP_THRESHOLD) {
      // Snap right → like
      setPosition(MAX_DRAG);
      setTimeout(() => {
        onSwipe("like");
        setAnimating(true);
        setPosition(CENTER);
      }, 250);
    } else if (position < SNAP_THRESHOLD) {
      // Snap left → dislike
      setPosition(0);
      setTimeout(() => {
        onSwipe("dislike");
        setAnimating(true);
        setPosition(CENTER);
      }, 250);
    } else {
      // Not enough — snap back to center
      setPosition(CENTER);
    }
  }, [position, onSwipe]);

  const transitionStyle = animating
    ? "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
    : "none";

  return (
    <div
      className="select-none"
      style={{ touchAction: "none", cursor: disabled ? "default" : "grab" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <svg viewBox="0 0 180 100" width="180" height="100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="st-neutralBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D0D0D0" />
            <stop offset="100%" stopColor="#B8B8B8" />
          </linearGradient>
          <linearGradient id="st-redBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E75545" />
            <stop offset="100%" stopColor="#C53A2A" />
          </linearGradient>
          <linearGradient id="st-greenBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#76E58F" />
            <stop offset="100%" stopColor="#4BCC6B" />
          </linearGradient>
          <filter id="st-shadowBg" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#000000" floodOpacity="0.15" />
          </filter>
          <filter id="st-shadowKnob" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.2" />
          </filter>
        </defs>

        {/* Neutral gray base */}
        <path
          d="M 50 10 C 75 10, 75 25, 90 25 C 105 25, 105 10, 130 10 A 40 40 0 1 1 130 90 C 105 90, 105 75, 90 75 C 75 75, 75 90, 50 90 A 40 40 0 1 1 50 10 Z"
          fill="url(#st-neutralBg)"
          filter="url(#st-shadowBg)"
        />

        {/* Red layer (left drag) */}
        <path
          d="M 50 10 C 75 10, 75 25, 90 25 C 105 25, 105 10, 130 10 A 40 40 0 1 1 130 90 C 105 90, 105 75, 90 75 C 75 75, 75 90, 50 90 A 40 40 0 1 1 50 10 Z"
          fill="url(#st-redBg)"
          opacity={leftProgress}
          style={{ transition: transitionStyle }}
        />

        {/* Green layer (right drag) */}
        <path
          d="M 50 10 C 75 10, 75 25, 90 25 C 105 25, 105 10, 130 10 A 40 40 0 1 1 130 90 C 105 90, 105 75, 90 75 C 75 75, 75 90, 50 90 A 40 40 0 1 1 50 10 Z"
          fill="url(#st-greenBg)"
          opacity={rightProgress}
          style={{ transition: transitionStyle }}
        />

        {/* Knob */}
        <g
          transform={`translate(${position}, 0)`}
          style={{ transition: transitionStyle }}
        >
          <circle cx="50" cy="50" r="34" fill="#FFFFFF" filter="url(#st-shadowKnob)" />

          {/* Neutral directional chevrons */}
          <g opacity={neutralOpacity * 0.25} style={{ transition: transitionStyle }}>
            <path
              d="M 39 44 L 34 50 L 39 56"
              stroke="#999999"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M 61 44 L 66 50 L 61 56"
              stroke="#999999"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </g>

          {/* X icon (appears on left drag) */}
          <g opacity={leftProgress} style={{ transition: transitionStyle }}>
            <path
              d="M 38 38 L 62 62 M 62 38 L 38 62"
              stroke="#E75545"
              strokeWidth="8"
              strokeLinecap="round"
            />
          </g>

          {/* Check icon (appears on right drag) */}
          <g opacity={rightProgress} style={{ transition: transitionStyle }}>
            <path
              d="M 38 52 L 46 60 L 62 40"
              stroke="#4BCC6B"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </g>
        </g>
      </svg>
    </div>
  );
};

export default SwipeToggle;
