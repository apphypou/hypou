import { ArrowLeft, ArrowRight, Camera, Pencil, User, MapPin, Check, Plus } from "lucide-react";
import { useState } from "react";

const categories = [
  { emoji: "📱", label: "Celulares" },
  { emoji: "🚗", label: "Carros & Motos" },
  { emoji: "👕", label: "Moda" },
  { emoji: "🛋️", label: "Casa" },
  { emoji: "🎮", label: "Videogames", wide: true },
];

const Perfil = () => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [itemName, setItemName] = useState("");
  const [itemValue, setItemValue] = useState("");
  const [itemDesc, setItemDesc] = useState("");

  const toggleCategory = (label: string) => {
    setSelected((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-black text-white font-display overflow-hidden antialiased">
      {/* Header */}
      <header className="relative z-40 flex w-full justify-between items-center px-6 pt-12 pb-2">
        <button
          onClick={() => step > 1 && setStep(step - 1)}
          className="h-10 w-10 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s === step ? "w-6 bg-primary neon-glow" : "w-1.5 bg-white/20"
              }`}
            />
          ))}
        </div>
        <button className="text-sm font-semibold text-white/40 hover:text-white transition-colors">
          Pular
        </button>
      </header>

      {/* Step 1 - Profile */}
      {step === 1 && (
        <>
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

          <div className="relative z-50 w-full p-6 pb-10 bg-gradient-to-t from-black via-black to-transparent">
            <button
              onClick={() => setStep(2)}
              className="w-full h-14 rounded-xl bg-primary text-black font-bold text-lg uppercase tracking-wider hover:bg-white hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all active:scale-[0.98] neon-glow flex items-center justify-center gap-2"
            >
              <span>PRÓXIMO</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </>
      )}

      {/* Step 2 - Categories */}
      {step === 2 && (
        <>
          <main className="relative flex-1 flex flex-col w-full px-6 pt-6 pb-8 z-10 overflow-y-auto no-scrollbar">
            <div className="flex flex-col mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-white mb-3">
                O que você tá <br />
                <span className="text-primary text-glow">caçando hoje?</span>
              </h1>
              <p className="text-white/60 text-base leading-relaxed">
                Escolha as coisas que você mais tem interesse em trocar.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
              {categories.map((cat) => {
                const isSelected = selected.includes(cat.label);
                return (
                  <div
                    key={cat.label}
                    onClick={() => toggleCategory(cat.label)}
                    className={`group relative rounded-3xl bg-[#0f1718] cursor-pointer transition-all hover:scale-[1.02] active:scale-95 ${
                      cat.wide
                        ? "aspect-[4/3] col-span-2 flex-row items-center justify-start px-8 gap-4 flex"
                        : "aspect-[4/3] flex flex-col items-center justify-center gap-3"
                    } ${
                      isSelected
                        ? "border border-primary ring-1 ring-primary/50 neon-border-glow"
                        : "border border-white/5 hover:border-white/20"
                    }`}
                  >
                    {/* Check / Circle */}
                    {cat.wide ? (
                      <div className={`absolute top-1/2 -translate-y-1/2 right-6 transition-opacity ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                        {isSelected ? (
                          <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-3 w-3 text-black" strokeWidth={3} />
                          </div>
                        ) : (
                          <div className="h-5 w-5 rounded-full border border-white/30" />
                        )}
                      </div>
                    ) : (
                      <div className={`absolute top-3 right-3 transition-opacity ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                        {isSelected ? (
                          <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-3 w-3 text-black" strokeWidth={3} />
                          </div>
                        ) : (
                          <div className="h-5 w-5 rounded-full border border-white/30" />
                        )}
                      </div>
                    )}

                    <span className={`text-4xl ${isSelected ? "filter drop-shadow-lg" : "opacity-80 group-hover:opacity-100 transition-opacity"}`}>
                      {cat.emoji}
                    </span>
                    <span className={`tracking-wide ${isSelected ? "font-semibold text-white" : "font-medium text-white/60 group-hover:text-white transition-colors"} ${cat.wide ? "text-lg" : ""}`}>
                      {cat.label}
                    </span>
                  </div>
                );
              })}

              {/* Outros */}
              <div className="group relative aspect-[4/3] rounded-3xl bg-[#0f1718]/50 border border-white/5 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:bg-[#0f1718]/80">
                <Plus className="h-8 w-8 text-white/20" />
                <span className="text-xs font-medium text-white/30 uppercase tracking-widest">Outros</span>
              </div>
            </div>
          </main>

          <div className="relative z-50 w-full p-6 pb-10 bg-gradient-to-t from-black via-black to-transparent">
            <button
              onClick={() => setStep(3)}
              className="w-full h-14 rounded-xl bg-primary text-black font-bold text-lg uppercase tracking-wider hover:bg-white hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all active:scale-[0.98] neon-glow flex items-center justify-center gap-2"
            >
              <span>PRÓXIMO</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </>
      )}

      {/* Step 3 - Cadastro de Item */}
      {step === 3 && (
        <>
          <main className="relative flex-1 flex flex-col w-full px-6 pt-6 pb-8 z-10 overflow-y-auto no-scrollbar">
            <div className="flex flex-col mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-white mb-3">
                O que você vai <br />
                <span className="text-primary text-glow">desapegar?</span>
              </h1>
              <p className="text-white/60 text-base leading-relaxed">
                Cadastre seu item para começar as trocas.
              </p>
            </div>

            {/* Photo Upload Area */}
            <div className="relative w-full aspect-[16/10] rounded-3xl bg-[#0f1718] flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:bg-[#0f1718]/80 mb-8 dashed-border-glow">
              <div className="h-14 w-14 rounded-full bg-[#1a2526] flex items-center justify-center">
                <Camera className="h-7 w-7 text-primary/60" />
              </div>
              <span className="text-sm font-bold text-primary uppercase tracking-wider">Adicionar fotos</span>
              <span className="text-xs text-white/30">Até 5 fotos de alta qualidade</span>
            </div>

            {/* Form Fields */}
            <div className="flex flex-col gap-5 w-full">
              <div>
                <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 pl-1">
                  Nome do Item
                </label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="Ex: iPhone 14 Pro Max 256GB"
                  className="w-full bg-[#0f1718]/50 border border-white/10 text-white rounded-xl px-5 py-4 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-white/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 pl-1">
                  Valor Estimado (R$)
                </label>
                <input
                  type="text"
                  value={itemValue}
                  onChange={(e) => setItemValue(e.target.value)}
                  placeholder="0,00"
                  className="w-full bg-[#0f1718]/50 border border-white/10 text-white rounded-xl px-5 py-4 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-white/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 pl-1">
                  Descrição
                </label>
                <textarea
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  placeholder="Detalhes sobre condição, tempo de uso, etc..."
                  rows={3}
                  className="w-full bg-[#0f1718]/50 border border-white/10 text-white rounded-xl px-5 py-4 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-white/20 resize-none"
                />
              </div>
            </div>
          </main>

          <div className="relative z-50 w-full p-6 pb-10 bg-gradient-to-t from-black via-black to-transparent">
            <button
              className="w-full h-14 rounded-xl bg-primary text-black font-bold text-lg uppercase tracking-wider hover:bg-white hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all active:scale-[0.98] neon-glow flex items-center justify-center gap-2"
            >
              <span>CONTINUAR</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Perfil;
