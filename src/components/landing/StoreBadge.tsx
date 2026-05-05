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
  <svg viewBox="0 0 512 512" className={className} aria-hidden="true">
    <path fill="#00d4ff" d="M48 41.4v429.2c0 5.6 6.2 9 11 6L295 256 59 35.4c-4.8-3-11 .4-11 6z" opacity=".95" />
    <path fill="#ffd400" d="M386.7 218.8L334.3 188.5 273 256l61.3 67.5 52.4-30.3c19.1-11 19.1-38.4 0-49.4z" />
    <path fill="#ff3a44" d="M334.3 323.5L273 256l-86.5 95.3 153.2 88.5c10.3 5.9 22.8 4.5 31.4-3.6l-36.8-112.7z" opacity=".9" />
    <path fill="#00f076" d="M334.3 188.5L186.5 160.7l-.0 0L273 256l61.3-67.5z" opacity=".9" />
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
        "group relative inline-flex items-center gap-3 rounded-2xl border px-5 py-3 backdrop-blur-2xl transition-colors",
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
