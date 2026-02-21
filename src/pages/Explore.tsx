import { Heart, X, Zap, Search, MessageSquare, User, SlidersHorizontal, MapPin, Compass, Handshake, Image } from "lucide-react";
import { useState } from "react";

const MOCK_ITEMS = [
  {
    id: 1,
    title: "Mansão Morumbi",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCX-F5mRp9yF5XL5xm8NDWAbCcse4MqlextTbPvBCQ1McUrOlmCutVVTUv8V2HB8uZv729Gx9b4_Ku-wp2AqOfiVSeu2dVr-VpyGPpKptDZOBTHmrPEsjTAUYZ8_FHbbXlWilZL6-vdhHPqJNx7VNxZHx7mgruGxuBf6AuUTv80qhp68E-IyBq-Llk84GUK1tWZk22yiXSjHbMDhrb-ttNP0r3jlF8qJYkozErryFurE8d052zzfddJEf8JiggMRhNvmU6bfvcD31o",
    price: "R$18.500.000",
    badge: "IMÓVEL PREMIUM",
    location: "São Paulo, SP",
    photos: 12,
  },
  {
    id: 2,
    title: "Porsche 911 GT3",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDvz6YSWz4_L3dWfJwvh8vT8u3k8ZPJkkRp0a0j_TFwL6TfKlPzXf_r8nW5kFhvmXu3z4GRlFR7mME7d35KPsEfELiH3rPQ0WMEHxHG0IXeZ-RVlaBxQ3x5YEqH0g5ufTQJ9F5jXq4K7TUZdW3wIIlCVkXbCH27LSzIQi8hF4z5uGjqvH3Y3Pd",
    price: "R$1.200.000",
    badge: "VEÍCULO PREMIUM",
    location: "Rio de Janeiro, RJ",
    photos: 8,
  },
];

const Explore = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const item = MOCK_ITEMS[currentIndex % MOCK_ITEMS.length];

  const handleAction = () => {
    setCurrentIndex((prev) => prev + 1);
  };

  return (
    <div className="relative flex flex-col h-[100dvh] bg-background overflow-hidden">
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
        <button className="h-11 w-11 flex items-center justify-center rounded-full bg-secondary/50 border border-border hover:bg-secondary/80 transition-all">
          <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
        </button>
      </header>

      {/* Card Area */}
      <main className="relative flex-1 flex flex-col items-center justify-center w-full px-5 pb-8 pt-2 z-10">
        <div className="relative w-full h-full max-h-[640px] flex flex-col">
          {/* Stacked card behind */}
          <div className="absolute inset-0 z-0 bg-secondary rounded-[2.5rem] border border-border/50 transform scale-[0.93] -translate-y-4 opacity-40" />

          {/* Main card */}
          <div className="relative z-10 flex-1 w-full bg-secondary rounded-[2.5rem] overflow-hidden border border-border/60 flex flex-col shadow-[0_10px_40px_-10px_rgba(0,0,0,0.7)]">
            {/* Image */}
            <div className="absolute inset-0">
              <img
                alt={item.title}
                className="w-full h-full object-cover"
                src={item.image}
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
            </div>

            {/* Content overlay */}
            <div className="relative mt-auto w-full p-7 pb-28 space-y-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-foreground/10 backdrop-blur-md border border-border text-foreground/90 text-[10px] font-bold tracking-[0.1em] uppercase">
                    {item.badge}
                  </span>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-border/30 text-foreground/80">
                    <Image className="h-3.5 w-3.5" />
                    <span className="text-[11px] font-semibold">{item.photos}</span>
                  </div>
                </div>
                <div className="space-y-0.5">
                  <h2 className="text-foreground text-3xl font-bold tracking-tight">{item.title}</h2>
                  <div className="flex items-center gap-1.5 text-foreground/60">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{item.location}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-foreground/40 text-[11px] font-bold uppercase tracking-widest">
                  Valor Estimado
                </span>
                <span className="text-primary text-3xl font-extrabold tracking-tighter text-glow uppercase">
                  {item.price}
                </span>
              </div>
            </div>

            {/* Action buttons inside card */}
            <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center items-center gap-6 px-4">
              <button
                onClick={handleAction}
                className="flex items-center justify-center h-16 w-16 rounded-full bg-secondary/80 border border-border backdrop-blur-xl transition-all active:scale-90 hover:bg-secondary"
              >
                <X className="h-8 w-8 text-muted-foreground" />
              </button>
              <button
                onClick={handleAction}
                className="flex items-center justify-center h-14 w-14 rounded-full bg-background border border-primary/40 text-primary neon-glow backdrop-blur-xl transition-all active:scale-90 -translate-y-2"
              >
                <Zap className="h-7 w-7" />
              </button>
              <button
                onClick={handleAction}
                className="flex items-center justify-center h-16 w-16 rounded-full bg-primary border border-primary/20 text-background shadow-xl transition-all active:scale-90"
              >
                <Heart className="h-8 w-8" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Tab Bar */}
      <nav className="glass-panel relative z-50 w-full pb-8 pt-4 px-10">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <button className="flex flex-col items-center gap-1.5 text-primary">
            <div className="relative flex items-center justify-center h-8 w-8">
              <Compass className="h-7 w-7 text-glow" />
              <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-primary neon-glow" />
            </div>
            <span className="text-[10px] font-bold tracking-wider uppercase">Explorar</span>
          </button>
          <button className="flex flex-col items-center gap-1.5 text-muted-foreground/40 hover:text-muted-foreground/80 transition-colors">
            <Handshake className="h-7 w-7" />
            <span className="text-[10px] font-bold tracking-wider uppercase">Matches</span>
          </button>
          <button className="flex flex-col items-center gap-1.5 text-muted-foreground/40 hover:text-muted-foreground/80 transition-colors relative">
            <MessageSquare className="h-7 w-7" />
            <span className="text-[10px] font-bold tracking-wider uppercase">Chat</span>
            <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-primary border border-background" />
          </button>
          <button className="flex flex-col items-center gap-1.5 text-muted-foreground/40 hover:text-muted-foreground/80 transition-colors">
            <User className="h-7 w-7" />
            <span className="text-[10px] font-bold tracking-wider uppercase">Perfil</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Explore;
