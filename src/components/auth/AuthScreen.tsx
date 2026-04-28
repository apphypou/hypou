import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { type ReactNode } from "react";
import HypouLogo from "@/components/HypouLogo";

interface AuthScreenProps {
  /** Main heading. The highlighted word receives the cyan gradient. */
  title: ReactNode;
  subtitle?: string;
  /** Optional override for the back button destination. Defaults to navigate(-1). */
  backTo?: string;
  showBack?: boolean;
  children: ReactNode;
  /** Footer content (e.g. "Já tem conta? Entrar") */
  footer?: ReactNode;
}

const AuthScreen = ({
  title,
  subtitle,
  backTo,
  showBack = true,
  children,
  footer,
}: AuthScreenProps) => {
  const navigate = useNavigate();

  return (
    <div className="dark relative flex flex-col min-h-screen bg-background text-foreground font-display antialiased overflow-hidden">
      {/* Ambient glow background */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]"
      />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-5 pt-safe pt-6 pb-2">
        {showBack ? (
          <button
            type="button"
            onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
            aria-label="Voltar"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-foreground/10 bg-foreground/5 backdrop-blur-xl text-foreground/80 hover:text-foreground hover:bg-foreground/10 transition-all active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : (
          <div className="h-10 w-10" />
        )}
        <HypouLogo size="sm" />
        <div className="h-10 w-10" />
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-8">
        <div className="w-full max-w-sm">
          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-muted-foreground text-sm mt-2">{subtitle}</p>
            )}
          </div>

          {/* Body */}
          {children}

          {/* Footer */}
          {footer && (
            <div className="pt-8 text-center">
              <p className="text-muted-foreground text-sm">{footer}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AuthScreen;
