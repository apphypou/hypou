import { Diamond, ArrowRight, Globe } from "lucide-react";

const HERO_IMAGE_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCX-F5mRp9yF5XL5xm8NDWAbCcse4MqlextTbPvBCQ1McUrOlmCutVVTUv8V2HB8uZv729Gx9b4_Ku-wp2AqOfiVSeu2dVr-VpyGPpKptDZOBTHmrPEsjTAUYZ8_FHbbXlWilZL6-vdhHPqJNx7VNxZHx7mgruGxuBf6AuUTv80qhp68E-IyBq-Llk84GUK1tWZk22yiXSjHbMDhrb-ttNP0r3jlF8qJYkozErryFurE8d052zzfddJEf8JiggMRhNvmU6bfvcD31o";

const Index = () => {
  return (
    <div className="relative min-h-screen flex flex-col justify-between">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0 h-full w-full overflow-hidden">
        <div
          className="h-[70vh] w-full bg-cover bg-center"
          style={{ backgroundImage: `url('${HERO_IMAGE_URL}')` }}
        />
        {/* Gradient Fades */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-background/60 to-background" />
        <div className="absolute bottom-0 h-1/2 w-full bg-gradient-to-t from-background via-background to-transparent" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex w-full justify-between items-center px-6 pt-12 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 border border-primary/30 backdrop-blur-md">
            <Diamond className="h-5 w-5 text-primary" />
          </div>
        </div>
        <button className="text-foreground/70 hover:text-foreground transition-colors">
          <Globe className="h-5 w-5" />
        </button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col w-full px-6 pb-8 pt-10 mt-auto">
        {/* Badge */}
        <div className="mb-6 space-y-4">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm w-fit mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mr-2 animate-pulse" />
            <span className="text-primary text-xs font-semibold tracking-wider uppercase">
              Exclusive Club
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-foreground text-[40px] leading-[1.1] font-bold tracking-tight">
            Boas-Vindas à <br />
            <span className="gradient-text">Permuta de Patrimônio</span>
          </h1>

          <p className="text-muted-foreground text-lg font-light leading-relaxed max-w-sm">
            Conecte-se para permutar patrimônio. O match perfeito para o seu
            próximo grande negócio.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-4 mt-4">
          <button className="group relative flex w-full items-center justify-center overflow-hidden rounded-full bg-primary h-14 px-8 text-primary-foreground transition-all duration-300 active:scale-[0.98] neon-glow-hover">
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <span className="relative text-base font-bold tracking-wide flex items-center gap-2">
              Criar conta
              <ArrowRight className="h-5 w-5" />
            </span>
          </button>

          <button className="flex w-full items-center justify-center rounded-full border border-foreground/20 bg-foreground/5 h-14 px-8 text-foreground backdrop-blur-sm transition-all duration-300 active:scale-[0.98] hover:bg-foreground/10 hover:border-foreground/40">
            <span className="text-base font-semibold tracking-wide">Entrar</span>
          </button>
        </div>

        {/* Footer Links */}
        <div className="mt-8 flex justify-center gap-6 text-xs text-muted-foreground font-medium tracking-wide">
          <a className="hover:text-primary transition-colors" href="#">
            Termos de Uso
          </a>
          <span className="w-1 h-1 rounded-full bg-muted my-auto" />
          <a className="hover:text-primary transition-colors" href="#">
            Política de Privacidade
          </a>
        </div>
      </div>
    </div>
  );
};

export default Index;
