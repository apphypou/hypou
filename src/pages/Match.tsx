import { X, Zap, MessageSquare, Home, Car, Star, Sparkles, Diamond, ArrowUpRight, Handshake } from "lucide-react";

const LEFT_IMAGE = "https://lh3.googleusercontent.com/aida-public/AB6AXuB5ey0k2uzHLA4tqGYpyhtuyW6Nk1zb_d3T4ot058Hz9NDSlomcsaCokxkT_5kJLW4YhlxbmGZE1b2OX_1eXzChV0fJLHgLwO1Otg2FjSq-mN8CbuyDeoE-b3bF3uOrCP7MuooKvgClbCc81iSYpMhN4vyu-ZlzsCDaqQPZTVFXjfZW_40_xzpjsZwt09tv7R_XhkejN1gbloh7FMrDNcxDR8RXBx39_R0NvIXZ4lNns5BErVsUN8YJClxOJYqmxMAZuT673Er9DwM";
const RIGHT_IMAGE = "https://lh3.googleusercontent.com/aida-public/AB6AXuCd4yZWhQd1w1Y7b6LJMhO1j0Pera1OoefYgBilntSovXN5fjutH075eAm1ZBL-8ZGd3Mx53GIsGByQLyb12g1xE8K7en-NxkFjeLYxthXaoMW2Wx1pfiDF7O75I0Hf8GqkiTofe0bcxxBDfXBoXTPDH58Du7JjiMxznE8dTqda4JweQLXR60bKSseEMRZrOFqWZZfbBhLzJfT8fe7ibSbJsDfMwsu4JeUAVO8M64wZMknEAg4yfuvbPKT6EMBTTthvyRQKdYwT8jc";

const Match = () => {
  return (
    <div className="relative flex h-[100dvh] w-full flex-col bg-black overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f2223] to-[#050f0f]" />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-60">
        <Star className="absolute top-[15%] left-[10%] h-5 w-5 text-primary animate-float fill-primary" />
        <Diamond className="absolute top-[25%] right-[15%] h-3 w-3 text-primary animate-float-delayed opacity-60" />
        <div className="absolute top-[10%] left-[50%] h-2 w-2 rounded-full bg-foreground/40 animate-pulse" />
        <Sparkles className="absolute bottom-[40%] left-[5%] h-4 w-4 text-primary/50 animate-float-delayed rotate-45" />
        <Sparkles className="absolute top-[30%] left-[5%] h-3 w-3 text-foreground/30" />
        <Diamond className="absolute top-[20%] right-[5%] h-4 w-4 text-primary/40 fill-primary/40" />
        <ArrowUpRight className="absolute bottom-[30%] right-[10%] h-3 w-3 text-primary animate-pulse" />
      </div>

      {/* Top Bar */}
      <div className="flex items-center p-6 justify-between relative z-10">
        <button className="flex items-center justify-center h-10 w-10 rounded-full bg-foreground/5 backdrop-blur-sm border border-foreground/10 text-foreground hover:bg-foreground/10 transition-colors">
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-1 opacity-50">
          <Zap className="h-4 w-4 text-primary fill-primary" />
          <span className="text-foreground text-xs font-bold tracking-widest uppercase">Match!</span>
        </div>
        <div className="h-10 w-10" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full max-w-md mx-auto px-6">
        {/* Connection Visuals */}
        <div className="relative mb-10 w-full flex justify-center items-center h-48">
          {/* Glow */}
          <div className="absolute w-48 h-48 bg-primary/30 rounded-full blur-[60px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          {/* Connecting line */}
          <div className="absolute w-32 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0" />

          {/* Left Image */}
          <div className="relative z-10 animate-float">
            <div className="w-32 h-32 rounded-full border-4 border-[#0f2223] overflow-hidden shadow-2xl ring-2 ring-primary/50 translate-x-4">
              <img src={LEFT_IMAGE} alt="Sua Cobertura" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-2 right-0 translate-x-2 bg-[#0f2223] rounded-full p-1 border border-foreground/10">
              <div className="bg-primary/20 rounded-full p-1">
                <Home className="h-3.5 w-3.5 text-foreground" />
              </div>
            </div>
          </div>

          {/* Center Match Icon */}
          <div className="absolute z-30 bg-primary text-primary-foreground rounded-full p-2 border-4 border-[#0f2223] shadow-lg neon-glow scale-125">
            <Handshake className="h-6 w-6" />
          </div>

          {/* Right Image */}
          <div className="relative z-20 animate-float-delayed">
            <div className="w-32 h-32 rounded-full border-4 border-[#0f2223] overflow-hidden shadow-2xl ring-2 ring-primary/50 -translate-x-4">
              <img src={RIGHT_IMAGE} alt="Porsche 911 GT3" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-2 left-0 -translate-x-2 bg-[#0f2223] rounded-full p-1 border border-foreground/10">
              <div className="bg-primary/10 rounded-full p-1">
                <Star className="h-3.5 w-3.5 text-primary fill-primary" />
              </div>
            </div>
          </div>
        </div>

        {/* Text Content */}
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight leading-tight drop-shadow-lg">
            Conexão <br />
            <span className="text-primary text-glow">Estabelecida</span>
          </h1>
          <p className="text-muted-foreground text-base font-normal leading-relaxed max-w-xs mx-auto">
            Você e <span className="text-foreground font-semibold">Roberto</span> demonstraram interesse mútuo nos bens um do outro.
          </p>
          {/* Matched Asset Detail */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-foreground/5 rounded-full border border-foreground/5 mt-2">
            <Home className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-foreground/70 text-xs font-medium">Sua Cobertura</span>
            <svg className="h-3 w-3 text-primary mx-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 16l5-5-5-5M17 8l-5 5 5 5" />
            </svg>
            <Car className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-foreground/70 text-xs font-medium">Porsche 911 GT3</span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-6 pb-8 w-full max-w-md mx-auto relative z-10 flex flex-col gap-4">
        <button className="group relative flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-full h-14 bg-primary text-primary-foreground shadow-[0_0_20px_hsl(184_100%_50%/0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_hsl(184_100%_50%/0.6)]">
          <span className="absolute inset-0 bg-foreground/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-full" />
          <MessageSquare className="mr-2 h-5 w-5 relative z-10" />
          <span className="text-lg font-bold tracking-wide relative z-10">Iniciar conversa</span>
        </button>
        <button className="flex w-full cursor-pointer items-center justify-center rounded-full h-12 text-muted-foreground text-sm font-semibold hover:text-foreground transition-colors">
          Continuar buscando
        </button>
      </div>
    </div>
  );
};

export default Match;
