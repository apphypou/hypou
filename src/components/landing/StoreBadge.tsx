import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const AppleLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 384 512" className={className} aria-hidden="true">
    <path
      fill="currentColor"
      d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zM260.6 110.8c25.6-30.4 23.3-58.1 22.6-68.1-22.7 1.3-49 15.4-64 32.8-16.5 18.6-26.2 41.6-24.1 67.6 24.5 1.9 46.9-10.7 65.5-32.3z"
    />
  </svg>
);

const GooglePlayLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 256 280" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="gp-blue" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#00C3FF" />
        <stop offset="1" stopColor="#1A73E8" />
      </linearGradient>
      <linearGradient id="gp-red" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FF3A44" />
        <stop offset="1" stopColor="#C31162" />
      </linearGradient>
      <linearGradient id="gp-yellow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFD400" />
        <stop offset="1" stopColor="#FF8A00" />
      </linearGradient>
      <linearGradient id="gp-green" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0" stopColor="#00A95C" />
        <stop offset="1" stopColor="#00F076" />
      </linearGradient>
    </defs>
    {/* Blue left panel (play body) */}
    <path fill="url(#gp-blue)" d="M14 12c-3 1.6-5 4.7-5 9v238c0 4.3 2 7.4 5 9l132-128L14 12z" />
    {/* Green top-right panel */}
    <path fill="url(#gp-green)" d="M190 90L52 11C49.4 9.5 46.7 9.2 44.3 10.1L146 140l44-50z" />
    {/* Yellow right tip */}
    <path fill="url(#gp-yellow)" d="M232 122l-42-32-44 50 44 50 42-32c14-8 14-28 0-36z" />
    {/* Red bottom-right panel */}
    <path fill="url(#gp-red)" d="M44.3 269.9c2.4.9 5.1.6 7.7-.9l138-79-44-50L44.3 269.9z" />
  </svg>
);


interface StoreBadgeProps {
  store: "apple" | "google";
  href: string;
  highlighted?: boolean;
  className?: string;
}

const StoreBadge = ({ store, href, highlighted, className }: StoreBadgeProps) => {
  const isApple = store === "apple";
  const Icon = isApple ? AppleLogo : GooglePlayLogo;
  const topLine = isApple ? "Baixar na" : "Disponível no";
  const bottomLine = isApple ? "App Store" : "Google Play";
  const ariaLabel = `Baixar Hypou na ${bottomLine}`;

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 380, damping: 22 }}
      className={cn(
        "group relative inline-flex w-full items-center justify-center gap-3 rounded-2xl border px-5 py-3 backdrop-blur-2xl transition-colors sm:w-auto sm:justify-start",
        highlighted
          ? "border-primary/40 bg-primary/10 shadow-[0_0_40px_-10px_hsl(var(--primary)/0.5)]"
          : "border-foreground/10 bg-foreground/5 hover:border-foreground/20",
        className
      )}
    >
      <Icon
        className={cn("h-8 w-8 shrink-0", isApple && "text-foreground")}
      />
      <div className="text-left leading-tight">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{topLine}</p>
        <p className="text-base font-bold text-foreground">{bottomLine}</p>
      </div>
      {highlighted && (
        <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-primary/30" />
      )}
    </motion.a>
  );
};

export default StoreBadge;
