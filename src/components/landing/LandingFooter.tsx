import { Link } from "react-router-dom";
import HypouLogo from "@/components/HypouLogo";

const LandingFooter = () => {
  return (
    <footer className="border-t border-foreground/5 px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 md:flex-row md:justify-between">
        <HypouLogo size="sm" />
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <Link to="/termos" className="hover:text-foreground transition-colors">
            Termos
          </Link>
          <Link to="/privacidade" className="hover:text-foreground transition-colors">
            Privacidade
          </Link>
          <a href="mailto:contato@hypou.app" className="hover:text-foreground transition-colors">
            Suporte
          </a>
        </nav>
        <p className="text-[11px] text-muted-foreground/60">© 2026 Hypou</p>
      </div>
    </footer>
  );
};

export default LandingFooter;
