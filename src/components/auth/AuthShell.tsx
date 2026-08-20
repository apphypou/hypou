import type { ReactNode } from "react";
import { HYPOU_LOGO as logoHypou } from "@/config/brand";
import authBackground from "@/assets/auth-marketplace-bg.webp";
import { cn } from "@/lib/utils";

type AuthShellProps = {
  children: ReactNode;
  description: string;
  compact?: boolean;
};

const AuthShell = ({ children, description, compact = false }: AuthShellProps) => (
  <main className="dark relative min-h-[100dvh] overflow-x-hidden bg-[#020711] font-display text-white antialiased">
    <img
      src={authBackground}
      alt=""
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 h-full w-full select-none object-cover object-center"
    />
    <div className="pointer-events-none fixed inset-0 bg-black/35" aria-hidden="true" />

    <div
      className={cn(
        "relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col justify-center overflow-y-auto px-6",
        "pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]",
        compact ? "gap-5" : "gap-6",
      )}
    >
      <header className={cn("flex flex-col items-center text-center", compact ? "gap-3" : "gap-4")}>
        <img
          src={logoHypou}
          alt="Hypou - Troque, economize, realize"
          className={cn("h-auto object-contain drop-shadow-[0_0_24px_rgba(13,214,224,0.16)]", compact ? "w-48" : "w-56")}
        />
        <div className="space-y-2">
          <h1 className={cn("font-bold leading-tight", compact ? "text-xl" : "text-2xl")}>
            Troque o que não usa.
            <span className="block text-primary">Encontre o que precisa.</span>
          </h1>
          <p className="mx-auto max-w-[310px] text-sm leading-relaxed text-white/62">{description}</p>
        </div>
      </header>

      {children}
    </div>
  </main>
);

export default AuthShell;
