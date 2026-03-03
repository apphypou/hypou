import { useRef, useCallback, useEffect, useState } from "react";
import { type MotionValue, useMotionValueEvent } from "framer-motion";

interface SwipeToggleProps {
  onSwipe: (direction: "like" | "dislike") => void;
  disabled?: boolean;
  /** Reacts to card drag (-150..150 px range) */
  dragProgress?: MotionValue<number>;
}

const MAX_DRAG = 80; // SVG units the knob travels

const SwipeToggle = ({ onSwipe, disabled, dragProgress }: SwipeToggleProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const wasOn = useRef(false); // where knob was before drag started
  const [position, setPosition] = useState(0); // 0..MAX_DRAG
  const [animating, setAnimating] = useState(false);
  const externalDriving = useRef(false); // true while card drag controls the knob

  const progress = position / MAX_DRAG; // 0..1

  // React to external card drag
  useMotionValueEvent(dragProgress ?? null as any, "change", (v: number) => {
    if (!dragProgress) return;
    if (isDragging.current) return; // local drag takes priority
    // Map card drag (-150..150) to knob (0..MAX_DRAG)
    // Only positive (right) values move knob right
    const mapped = Math.max(0, Math.min(MAX_DRAG, (v / 150) * MAX_DRAG));
    externalDriving.current = true;
    setAnimating(false);
    setPosition(mapped);
  });

  // When card drag ends (goes back to 0), reset toggle
  useEffect(() => {
    if (!dragProgress) return;
    const unsub = dragProgress.on("change", (v: number) => {
      if (externalDriving.current && Math.abs(v) < 1 && !isDragging.current) {
        externalDriving.current = false;
        setAnimating(true);
        setPosition(0);
      }
    });
    return unsub;
  }, [dragProgress]);

  const updatePosition = useCallback((pos: number) => {
    setPosition(Math.max(0, Math.min(MAX_DRAG, pos)));
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (disabled) return;
    isDragging.current = true;
    externalDriving.current = false;
    startX.current = e.clientX;
    wasOn.current = position > MAX_DRAG / 2;
    setAnimating(false);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [disabled, position]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const walk = e.clientX - startX.current;
    const base = wasOn.current ? MAX_DRAG : 0;
    updatePosition(base + walk * 0.8); // 0.8 = slight damping for feel
  }, [updatePosition]);

  const handlePointerUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    setAnimating(true);

    if (position > MAX_DRAG / 2) {
      // Snap right → like
      setPosition(MAX_DRAG);
      setTimeout(() => {
        onSwipe("like");
        setAnimating(true);
        setPosition(0);
      }, 250);
    } else {
      // Snap left → dislike
      setPosition(0);
      setTimeout(() => {
        onSwipe("dislike");
      }, 250);
    }
  }, [position, onSwipe]);

  // Tap toggle
  const handleClick = useCallback(() => {
    if (disabled) return;
    // Only toggle on clean tap (not after drag)
    if (isDragging.current) return;
    setAnimating(true);
    const goingRight = position < MAX_DRAG / 2;
    setPosition(goingRight ? MAX_DRAG : 0);
    setTimeout(() => {
      onSwipe(goingRight ? "like" : "dislike");
      setAnimating(true);
      setPosition(0);
    }, 300);
  }, [disabled, position, onSwipe]);

  const transitionStyle = animating
    ? "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
    : "none";

  return (
    <div
      ref={containerRef}
      className="select-none"
      style={{ touchAction: "none", cursor: disabled ? "default" : "grab" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={handleClick}
    >
      <svg viewBox="0 0 180 100" width="180" height="100" xmlns="http://www.w3.org/2000/svg">
        <defs>
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

        {/* Red background (always visible) */}
        <path
          d="M 50 10 C 75 10, 75 25, 90 25 C 105 25, 105 10, 130 10 A 40 40 0 1 1 130 90 C 105 90, 105 75, 90 75 C 75 75, 75 90, 50 90 A 40 40 0 1 1 50 10 Z"
          fill="url(#st-redBg)"
          filter="url(#st-shadowBg)"
        />

        {/* Green background (fades in) */}
        <path
          d="M 50 10 C 75 10, 75 25, 90 25 C 105 25, 105 10, 130 10 A 40 40 0 1 1 130 90 C 105 90, 105 75, 90 75 C 75 75, 75 90, 50 90 A 40 40 0 1 1 50 10 Z"
          fill="url(#st-greenBg)"
          opacity={progress}
          style={{ transition: transitionStyle }}
        />

        {/* Knob group */}
        <g
          transform={`translate(${position}, 0)`}
          style={{ transition: transitionStyle }}
        >
          <circle cx="50" cy="50" r="34" fill="#FFFFFF" filter="url(#st-shadowKnob)" />

          {/* X icon */}
          <g opacity={1 - progress} style={{ transition: transitionStyle }}>
            <path
              d="M 38 38 L 62 62 M 62 38 L 38 62"
              stroke="#E75545"
              strokeWidth="8"
              strokeLinecap="round"
            />
          </g>

          {/* Check icon */}
          <g opacity={progress} style={{ transition: transitionStyle }}>
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
