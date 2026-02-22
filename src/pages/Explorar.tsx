import { X, Zap, Heart, MapPin, SlidersHorizontal, Image, Compass, Handshake, MessageSquare, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CARD_IMAGE_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCX-F5mRp9yF5XL5xm8NDWAbCcse4MqlextTbPvBCQ1McUrOlmCutVVTUv8V2HB8uZv729Gx9b4_Ku-wp2AqOfiVSeu2dVr-VpyGPpKptDZOBTHmrPEsjTAUYZ8_FHbbXlWilZL6-vdhHPqJNx7VNxZHx7mgruGxuBf6AuUTv80qhp68E-IyBq-Llk84GUK1tWZk22yiXSjHbMDhrb-ttNP0r3jlF8qJYkozErryFurE8d052zzfddJEf8JiggMRhNvmU6bfvcD31o";

const navItems = [
  { icon: Compass, label: "Explorar", active: true, path: "/explorar" },
  { icon: Handshake, label: "Matches", active: false, path: "/partidas" },
  { icon: MessageSquare, label: "Chat", active: false, badge: true, path: "/explorar" },
  { icon: UserCircle, label: "Perfil", active: false, path: "/meu-perfil" },
];

const Explorar = () => {
  const navigate = useNavigate();
  return (
    <div className="relative flex flex-col h-[100dvh] bg-black text-foreground overflow-hidden">
      {/* Header */}
      <header className="relative z-40 flex w-full justify-between items-center px-6 pt-12 pb-4">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.2em] text-primary/70 font-bold mb-0.5">
            Premium Marketplace
          </span>
          <h1 className="text-foreground text-xl font-extrabold tracking-tight">
            Explorar <span className="text-primary">Permutas</span>
          </h1>
        </div>
        <button className="h-11 w-11 flex items-center justify-center rounded-full bg-muted/50 border border-foreground/10 text-foreground/80 hover:bg-foreground/10 transition-all">
          <SlidersHorizontal className="h-5 w-5" />
        </button>
      </header>

      {/* Main Card Area */}
      <main className="relative flex-1 flex flex-col items-center justify-start w-full px-5 pb-8 pt-2 z-10">
        <div className="relative w-full h-full max-h-[640px] flex flex-col">
          {/* Background stack card */}
          <div className="absolute inset-0 z-0 bg-muted rounded-[2.5rem] border border-foreground/5" style={{ transform: "scale(0.93) translateY(-15px)", opacity: 0.4 }} />

          {/* Main card */}
          <div className="relative z-10 flex-1 w-full bg-muted rounded-[2.5rem] overflow-hidden border border-foreground/10 flex flex-col swipe-card">
            {/* Image */}
            <div className="absolute inset-0">
              <img
                alt="Luxury Asset"
                className="w-full h-full object-cover"
                src={CARD_IMAGE_URL}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
            </div>

            {/* Card Content */}
            <div className="relative mt-auto w-full p-7 pb-28 space-y-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-foreground/10 backdrop-blur-md border border-foreground/10 text-foreground/90 text-[10px] font-bold tracking-[0.1em] uppercase">
                    Imóvel Premium
                  </span>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-foreground/5 text-foreground/80">
                    <Image className="h-3.5 w-3.5" />
                    <span className="text-[11px] font-semibold">12</span>
                  </div>
                </div>
                <div className="space-y-0.5">
                  <h2 className="text-foreground text-3xl font-bold tracking-tight">Mansão Morumbi</h2>
                  <div className="flex items-center gap-1.5 text-foreground/60">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">São Paulo, SP</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-foreground/40 text-[11px] font-bold uppercase tracking-widest">
                  Valor Estimado
                </span>
                <span className="text-primary text-3xl font-extrabold tracking-tighter text-glow uppercase">
                  R$18.500.000
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center items-center gap-6 px-4">
              <button className="flex items-center justify-center h-16 w-16 rounded-full bg-muted/80 border border-foreground/10 text-foreground/50 backdrop-blur-xl transition-all active:scale-90 hover:bg-foreground/5">
                <X className="h-8 w-8" />
              </button>
              <button className="flex items-center justify-center h-14 w-14 rounded-full bg-background border border-primary/40 text-primary neon-glow backdrop-blur-xl transition-all active:scale-90 -translate-y-2">
                <Zap className="h-7 w-7" />
              </button>
              <button className="flex items-center justify-center h-16 w-16 rounded-full bg-primary border border-primary/20 text-background shadow-xl transition-all active:scale-90">
                <Heart className="h-8 w-8" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation - Floating */}
      <div className="absolute bottom-0 left-0 right-0 z-50 w-full flex justify-center pb-6 px-5">
        <nav className="glass-panel rounded-full px-8 py-3 flex justify-between items-center w-full max-w-md">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 transition-colors relative ${
                item.active ? "text-primary" : "text-foreground/50 hover:text-foreground/80"
              }`}
            >
              <div className="relative flex items-center justify-center h-8 w-8">
                <item.icon className={`h-6 w-6 ${item.active ? "text-glow" : ""}`} />
                {item.badge && (
                  <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primary border border-background" />
                )}
              </div>
              <span className="text-[9px] font-bold tracking-wider uppercase">{item.label}</span>
              {item.active && (
                <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-primary neon-glow" />
              )}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Explorar;
