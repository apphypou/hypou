import { ArrowLeft, Settings, MapPin, Pencil, PlusCircle, Compass, Handshake, MessageSquare, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const navItems = [
  { icon: Compass, label: "Explorar", active: false, path: "/explorar" },
  { icon: Handshake, label: "Matches", active: false, path: "/match" },
  { icon: MessageSquare, label: "Chat", active: false, path: "/explorar", badge: true },
  { icon: UserCircle, label: "Perfil", active: true, path: "/meu-perfil" },
];

const stats = [
  { value: "12", label: "Permutas", highlight: false },
  { value: "4.9", label: "Rating", highlight: true },
  { value: "38", label: "Matches", highlight: false },
];

const assets = [
  {
    category: "Imóvel",
    name: "Mansão Morumbi",
    value: "R$ 18.5M",
    status: "green",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC67zydhocrgUd5xqhXH4Mxobd8z80k7yuh9_GergtIfDj6-q472LYoJ-6Dcn7TVfZlMJ9j9ST0crzzKbiQtXo8S71d2OMx-UWO2wcPMbBAKpW0QfVfhvku8ENTes3ENOT8Hh0OfCG_CpuVusf5-AVJRmUqQCHxTh_Hq-bLv19SFXN5bfH0RHakp6TA8-jcMP9r7YU_rDRb5cye7bi-_D9WV4PUxjJHPfBEb-2xN0qZcBDcB8Xjn-MbzP2xeWhFRn3e6IcUu10y2w0",
  },
  {
    category: "Veículo",
    name: "Porsche 911 GT3",
    value: "R$ 1.2M",
    status: "green",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCMxRChPb6jRAaV1I8KHmpntN8-fTL4wt5QSGkyzfFJLeta2mDuw20KpxOhCjWhu0c4LpEWI1R4CK-6GvKZs7dP2toGGikRjfXYWiBzuKl9E6IvuwMbifLKr3S4pRgO0qoFUxlUSgSfz4VHbZypZTZZa1SPleW96EFwPKXhsGaaaKndoARVsTznajBF38kJScBNDOUqlDNWS1ScxFWlySEmGzBS5AXVtm1SbKc6HipQs9pGs9U6C5FKh6txjxTEo-OuAzujhRT0WyM",
  },
  {
    category: "Jóia",
    name: "Patek Philippe Nautilus",
    value: "R$ 850K",
    status: "yellow",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA7wHWGbe3HYbOOajln0l4uSsD-6tCiLN3lZxCribR1GTOhYhVoRpDBQ8LDJwE3ggMw_dVwg-Z9V792o7n5PrxUSkvRwEipW2RE8VO_wZBhHhHHlKCYx94Yjb4c1sC1DiPwAOwpoNA0MYhzrgu54BsJYovj91Bzoh7FuKXGfA-02W2BUqn_ACcSDV67OfgRwJsFPAgfcAji4P-WQ6vhENOBEeSXn01IYZL-rnTvQv8ftT_CtPsqKUkLryCtw1ApUT-sw_oFqWRKlO0",
  },
];

const PROFILE_IMAGE = "https://lh3.googleusercontent.com/aida-public/AB6AXuCX-F5mRp9yF5XL5xm8NDWAbCcse4MqlextTbPvBCQ1McUrOlmCutVVTUv8V2HB8uZv729Gx9b4_Ku-wp2AqOfiVSeu2dVr-VpyGPpKptDZOBTHmrPEsjTAUYZ8_FHbbXlWilZL6-vdhHPqJNx7VNxZHx7mgruGxuBf6AuUTv80qhp68E-IyBq-Llk84GUK1tWZk22yiXSjHbMDhrb-ttNP0r3jlF8qJYkozErryFurE8d052zzfddJEf8JiggMRhNvmU6bfvcD31o";

const MeuPerfil = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-[100dvh] bg-black text-foreground overflow-hidden font-display antialiased">
      {/* Header */}
      <header className="relative z-40 flex w-full justify-between items-center px-6 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="h-10 w-10 flex items-center justify-center rounded-full bg-muted/50 border border-foreground/10 text-foreground/60 hover:text-foreground hover:bg-foreground/10 transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="text-sm font-bold tracking-wider uppercase text-foreground/80">Meu Perfil</span>
        </div>
        <button className="h-10 w-10 flex items-center justify-center rounded-full bg-muted/50 border border-foreground/10 text-foreground/80 hover:bg-foreground/10 transition-all">
          <Settings className="h-5 w-5" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full overflow-y-auto no-scrollbar pb-6">
        <div className="px-5 flex flex-col items-center">
          {/* Profile Section */}
          <div className="relative mt-2 mb-6 flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div className="h-32 w-32 rounded-full p-1 border-2 border-primary neon-glow bg-black">
                <img
                  alt="Profile"
                  className="w-full h-full object-cover rounded-full opacity-90 hover:opacity-100 transition-opacity"
                  src={PROFILE_IMAGE}
                />
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-gray-900 to-black border border-primary/30 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg w-max">
                <span className="text-primary text-[14px]">✦</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">Plano Elite</span>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">Roberto Vasconcelos</h1>
            <div className="flex items-center gap-1.5 text-foreground/50 text-sm mb-5">
              <MapPin className="h-4 w-4" />
              <span>São Paulo, SP</span>
            </div>

            <button className="group relative px-6 py-2.5 rounded-full border border-primary/50 bg-primary/5 hover:bg-primary/10 transition-all active:scale-95 flex items-center gap-2">
              <span className="text-primary text-xs font-bold tracking-widest uppercase group-hover:text-glow transition-all">
                Editar Perfil
              </span>
              <Pencil className="h-4 w-4 text-primary" />
            </button>
          </div>

          {/* Stats */}
          <div className="w-full grid grid-cols-3 gap-3 mb-8">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={`glass-card rounded-2xl p-3 flex flex-col items-center justify-center text-center ${
                  stat.highlight ? "border-primary/20 bg-primary/5" : ""
                }`}
              >
                <span className={`text-xl font-bold mb-0.5 ${stat.highlight ? "text-primary" : "text-foreground"}`}>
                  {stat.value}
                </span>
                <span
                  className={`text-[10px] uppercase tracking-wider font-semibold ${
                    stat.highlight ? "text-primary/60" : "text-foreground/40"
                  }`}
                >
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          {/* Meus Ativos */}
          <div className="w-full flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-bold text-foreground tracking-tight">Meus Ativos</h2>
              <button className="text-primary text-xs font-bold tracking-wide uppercase hover:text-foreground transition-colors flex items-center gap-1">
                <PlusCircle className="h-4 w-4" />
                Novo Item
              </button>
            </div>

            <div className="space-y-3 pb-24">
              {assets.map((asset) => (
                <div
                  key={asset.name}
                  className="group relative overflow-hidden rounded-2xl glass-card p-3 flex gap-4 transition-all hover:bg-foreground/5 active:scale-[0.99]"
                >
                  <div className="h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden bg-muted border border-foreground/10">
                    <img
                      alt={asset.name}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                      src={asset.image}
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-center gap-1">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold text-primary tracking-wider uppercase">{asset.category}</span>
                      <span
                        className={`h-2 w-2 rounded-full ${
                          asset.status === "green"
                            ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                            : "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]"
                        }`}
                      />
                    </div>
                    <h3 className="text-base font-bold text-foreground leading-tight">{asset.name}</h3>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-foreground/40 text-xs font-medium">Avaliado em</span>
                      <span className="text-foreground font-bold text-sm">{asset.value}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation - Floating */}
      <div className="relative z-50 w-full flex justify-center pb-6 px-5">
        <nav className="glass-panel rounded-full px-8 py-3 flex justify-between items-center w-full max-w-md">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 transition-colors relative ${
                item.active ? "text-primary" : "text-foreground/40 hover:text-foreground/80"
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

export default MeuPerfil;
