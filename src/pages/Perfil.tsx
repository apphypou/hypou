import { ArrowLeft, ArrowRight, Camera, Pencil, User, MapPin } from "lucide-react";
import { useState } from "react";

const Perfil = () => {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");

  return (
    <div className="flex flex-col h-[100dvh] bg-black text-white font-display overflow-hidden antialiased">
      {/* Header */}
      <header className="relative z-40 flex w-full justify-between items-center px-6 pt-12 pb-2">
        <button className="h-10 w-10 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex gap-1.5">
          <div className="w-6 h-1.5 rounded-full bg-primary neon-glow" />
          <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
          <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
          <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
        </div>
        <button className="text-sm font-semibold text-white/40 hover:text-white transition-colors">
          Pular
        </button>
      </header>

      {/* Main Content */}
      <main className="relative flex-1 flex flex-col w-full px-6 pt-6 pb-8 z-10 overflow-y-auto no-scrollbar">
        <div className="flex flex-col mb-8 items-center text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Bem-vindo.</h1>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-3">
            Crie seu <span className="text-primary text-glow">perfil premium</span>
          </h2>
          <p className="text-white/60 text-base leading-relaxed max-w-xs mx-auto">
            Para conectar com a elite, precisamos saber quem você é.
          </p>
        </div>

        {/* Avatar Upload */}
        <div className="flex flex-col items-center mb-10 w-full">
          <div className="relative group cursor-pointer">
            <div className="h-32 w-32 rounded-full bg-[#0f1718] border-2 border-primary neon-border-glow flex items-center justify-center overflow-hidden transition-transform hover:scale-105">
              <Camera className="h-10 w-10 text-primary/50 group-hover:text-primary transition-colors" />
            </div>
            <div className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-primary text-black flex items-center justify-center border-4 border-black shadow-lg">
              <Pencil className="h-4 w-4" />
            </div>
          </div>
          <span className="mt-3 text-sm text-white/40 font-medium">Adicionar foto de perfil</span>
        </div>

        {/* Form Fields */}
        <div className="flex flex-col gap-5 w-full">
          <div>
            <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 pl-1">
              Nome Completo
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Alessandro Silva"
                className="w-full bg-[#0f1718]/50 border border-white/10 text-white rounded-xl px-5 py-4 pl-12 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-white/20"
              />
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 pl-1">
              Localização Principal
            </label>
            <div className="relative">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: São Paulo, SP"
                className="w-full bg-[#0f1718]/50 border border-white/10 text-white rounded-xl px-5 py-4 pl-12 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-white/20"
              />
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
            </div>
          </div>
        </div>
      </main>

      {/* Bottom CTA */}
      <div className="relative z-50 w-full p-6 pb-10 bg-gradient-to-t from-black via-black to-transparent">
        <button className="w-full h-14 rounded-xl bg-primary text-black font-bold text-lg uppercase tracking-wider hover:bg-white hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all active:scale-[0.98] neon-glow flex items-center justify-center gap-2">
          <span>PRÓXIMO</span>
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default Perfil;
