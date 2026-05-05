import { Link } from "react-router-dom";
import { Heart, Instagram, Mail } from "lucide-react";
import HypouLogo from "@/components/HypouLogo";

const LandingFooter = () => {
  return (
    <footer className="relative border-t border-foreground/5 px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col items-center gap-3 md:items-start">
          <HypouLogo size="md" />
          <p className="max-w-xs text-center text-sm text-muted-foreground md:text-left">
            Troque o que tá parado pelo que você quer. Sem dinheiro, sem golpe.
          </p>
        </div>

        <nav className="flex flex-col items-center gap-3 text-sm text-muted-foreground md:items-start">
          <p className="text-xs font-semibold uppercase tracking-widest text-foreground/60">
            Legal
          </p>
          <Link to="/termos" className="hover:text-primary transition-colors">
            Termos de uso
          </Link>
          <Link to="/privacidade" className="hover:text-primary transition-colors">
            Privacidade
          </Link>
        </nav>

        <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground md:items-start">
          <p className="text-xs font-semibold uppercase tracking-widest text-foreground/60">
            Contato
          </p>
          <a
            href="mailto:contato@hypou.app"
            className="flex items-center gap-2 hover:text-primary transition-colors"
          >
            <Mail className="h-4 w-4" />
            contato@hypou.app
          </a>
          <a
            href="https://instagram.com/hypou.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-primary transition-colors"
          >
            <Instagram className="h-4 w-4" />
            @hypou.app
          </a>
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-6xl flex-col items-center justify-between gap-2 border-t border-foreground/5 pt-6 text-[11px] text-muted-foreground/60 md:flex-row">
        <p className="flex items-center gap-1.5">
          Feito com <Heart className="h-3 w-3 fill-primary text-primary" strokeWidth={0} /> no Brasil
        </p>
        <p>© 2026 Hypou. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
};

export default LandingFooter;
