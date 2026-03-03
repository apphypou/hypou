import { useRef, useCallback, useEffect, useState } from "react";
import { type MotionValue, useMotionValueEvent } from "framer-motion";

interface SwipeToggleProps {
  onSwipe: (direction: "like" | "dislike") => void;
  disabled?: boolean;
  dragProgress?: MotionValue<number>;
}

const MAX_DRAG = 80;
const CENTER = MAX_DRAG / 2;
const SNAP_THRESHOLD = 20;

const SwipeToggle = ({ onSwipe, disabled, dragProgress }: SwipeToggleProps) => {
  const isDragging = useRef(false);
  const startX = useRef(0);
  const basePos = useRef(CENTER);
  const [position, setPosition] = useState(CENTER);
  const [animating, setAnimating] = useState(false);
  const [snapping, setSnapping] = useState(false);
  const externalDriving = useRef(false);

  const rightProgress = Math.max(0, (position - CENTER) / (MAX_DRAG - CENTER));
  const leftProgress = Math.max(0, (CENTER - position) / CENTER);
  const neutralOpacity = Math.max(0, 1 - (leftProgress + rightProgress) * 3);

  // Knob center in SVG coords: pill starts at x=10, knob cx=50 at position=0
  // So knob cx = 50 + position. At CENTER(40), cx=90 (middle of 180-wide SVG)
  const knobCx = 50 + position;
  // Radial gradient center as percentage of pill width (10..170 = 160 wide)
  const radialCxPercent = ((knobCx - 10) / 160) * 100;

  useMotionValueEvent(dragProgress ?? null as any, "change", (v: number) => {
    if (!dragProgress) return;
    if (isDragging.current) return;
    const mapped = CENTER + (v / 150) * CENTER;
    const clamped = Math.max(0, Math.min(MAX_DRAG, mapped));
    externalDriving.current = true;
    setAnimating(false);
    setPosition(clamped);
  });

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
      setPosition(MAX_DRAG);
      setSnapping(true);
      setTimeout(() => {
        setSnapping(false);
        onSwipe("like");
        setAnimating(true);
        setPosition(CENTER);
      }, 300);
    } else if (position < SNAP_THRESHOLD) {
      setPosition(0);
      setSnapping(true);
      setTimeout(() => {
        setSnapping(false);
        onSwipe("dislike");
        setAnimating(true);
        setPosition(CENTER);
      }, 300);
    } else {
      setPosition(CENTER);
    }
  }, [position, onSwipe]);

  const transitionStyle = animating
    ? "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
    : "none";

  const knobScale = snapping ? 1.15 : 1;

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
            <stop offset="0%" stopColor="#E8E8ED" />
            <stop offset="100%" stopColor="#D8D8DE" />
          </linearGradient>
          <radialGradient id="st-redRadial" cx={`${radialCxPercent}%`} cy="50%" r="60%">
            <stop offset="0%" stopColor="#E75545" stopOpacity="1" />
            <stop offset="100%" stopColor="#E75545" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="st-greenRadial" cx={`${radialCxPercent}%`} cy="50%" r="60%">
            <stop offset="0%" stopColor="#4BCC6B" stopOpacity="1" />
            <stop offset="100%" stopColor="#4BCC6B" stopOpacity="0" />
          </radialGradient>
          <filter id="st-shadowBg" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#000000" floodOpacity="0.15" />
          </filter>
          <filter id="st-shadowKnob" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.2" />
          </filter>
        </defs>

        {/* Pill background */}
        <rect
          x="10" y="10" width="160" height="80" rx="40"
          fill="url(#st-neutralBg)"
          filter="url(#st-shadowBg)"
        />

        {/* Red radial glow (left drag) */}
        <rect
          x="10" y="10" width="160" height="80" rx="40"
          fill="url(#st-redRadial)"
          opacity={leftProgress}
          style={{ transition: transitionStyle }}
        />

        {/* Green radial glow (right drag) */}
        <rect
          x="10" y="10" width="160" height="80" rx="40"
          fill="url(#st-greenRadial)"
          opacity={rightProgress}
          style={{ transition: transitionStyle }}
        />

        {/* Knob */}
        <g
          transform={`translate(${position}, 0)`}
          style={{ transition: transitionStyle }}
        >
          <g
            transform={`translate(50, 50) scale(${knobScale}) translate(-50, -50)`}
            style={{ transition: "transform 0.15s ease-out" }}
          >
            <circle
              cx="50" cy="50" r="38"
              fill="#FFFFFF"
              stroke="rgba(0,0,0,0.08)"
              strokeWidth="1.5"
              filter="url(#st-shadowKnob)"
            />

            {/* Neutral directional chevrons */}
            <g opacity={neutralOpacity * 0.5} style={{ transition: transitionStyle }}>
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
                strokeWidth="10"
                strokeLinecap="round"
              />
            </g>

            {/* Check icon (appears on right drag) */}
            <g opacity={rightProgress} style={{ transition: transitionStyle }}>
              <path
                d="M 38 52 L 46 60 L 62 40"
                stroke="#4BCC6B"
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
};

export default SwipeToggle;
