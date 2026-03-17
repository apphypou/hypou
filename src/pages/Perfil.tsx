import { ArrowLeft, ArrowRight, Camera, Pencil, User, Check, Rocket, Loader2, Sparkles, Package } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { updateProfile, uploadAvatar, saveUserCategories } from "@/services/profileService";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { categories } from "@/constants/categories";
import LocationSearch from "@/components/LocationSearch";

const stepLabels = ["Perfil", "Interesses", "Pronto!"];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

const Perfil = () => {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const goToStep = (newStep: number) => {
    setDirection(newStep > step ? 1 : -1);
    setStep(newStep);
  };

  const toggleCategory = (label: string) => {
    setSelected((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleStep1Next = async () => {
    if (!user || !name.trim()) {
      toast({ title: "Preencha seu nome", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      let avatarUrl: string | undefined;
      if (avatarFile) {
        avatarUrl = await uploadAvatar(user.id, avatarFile);
      }
      await updateProfile(user.id, {
        display_name: name.trim(),
        location: location.trim() || null,
        avatar_url: avatarUrl,
      } as any);
      goToStep(2);
    } catch (err: any) {
      toast({ title: "Erro ao salvar perfil", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleStep2Next = async () => {
    if (!user || selected.length === 0) {
      toast({ title: "Selecione ao menos uma categoria", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await saveUserCategories(user.id, selected);
      goToStep(3);
    } catch (err: any) {
      toast({ title: "Erro ao salvar categorias", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = async (goTo: "explorar" | "novo-item") => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user.id, { onboarding_completed: true } as any);
      navigate(goTo === "explorar" ? "/explorar" : "/novo-item");
    } catch (err: any) {
      toast({ title: "Erro ao finalizar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Save whatever we have so far
      if (name.trim()) {
        await updateProfile(user.id, {
          display_name: name.trim(),
          location: location.trim() || null,
          onboarding_completed: true,
        } as any);
      } else {
        await updateProfile(user.id, { onboarding_completed: true } as any);
      }
      if (selected.length > 0) {
        await saveUserCategories(user.id, selected);
      }
      navigate("/explorar");
    } catch (err: any) {
      toast({ title: "Erro ao pular", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background text-foreground font-display overflow-hidden antialiased">
      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />

      {/* Header */}
      <header className="relative z-40 flex w-full flex-col items-center px-6 pt-6 pb-2">
        {/* Back button */}
        <div className="w-full flex justify-start mb-2">
          <button
            onClick={() => step > 1 && goToStep(step - 1)}
            className={`h-10 w-10 flex items-center justify-center rounded-full text-foreground/60 hover:text-foreground hover:bg-foreground/10 transition-all ${step === 1 ? "opacity-0 pointer-events-none" : ""}`}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>

        {/* Progress indicator with labels - centered */}
        <div className="flex items-center gap-6">
          {stepLabels.map((label, i) => {
            const s = i + 1;
            const isActive = s === step;
            const isDone = s < step;
            return (
              <div key={s} className="flex flex-col items-center gap-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    isActive ? "w-10 bg-primary neon-glow" : isDone ? "w-4 bg-primary/60" : "w-2 bg-foreground/20"
                  }`}
                />
                <span className={`text-xs font-medium transition-colors ${
                  isActive ? "text-primary" : isDone ? "text-foreground/50" : "text-foreground/20"
                }`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </header>

      {/* Animated Steps */}
      <AnimatePresence mode="wait" custom={direction}>
        {step === 1 && (
          <motion.div
            key="step1"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <main className="relative flex-1 flex flex-col w-full px-6 pt-4 pb-8 z-10 overflow-y-auto no-scrollbar">
              <div className="flex flex-col mb-6 items-center text-center">
                <h2 className="text-3xl font-bold tracking-tight text-foreground mb-3">
                  Crie <span className="text-primary text-glow">seu perfil</span>
                </h2>
                <p className="text-muted-foreground text-base leading-relaxed max-w-xs mx-auto">
                  Para começar a trocar, precisamos saber quem você é.
                </p>
              </div>

              <div className="flex flex-col items-center mb-10 w-full">
                <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                  <div className="h-32 w-32 rounded-full bg-card border-2 border-primary neon-border-glow flex items-center justify-center overflow-hidden transition-transform hover:scale-105">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="h-10 w-10 text-primary/50 group-hover:text-primary transition-colors" />
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-4 border-background shadow-lg">
                    <Pencil className="h-4 w-4" />
                  </div>
                </div>
                <span className="mt-3 text-sm text-muted-foreground font-medium">Adicionar foto de perfil</span>
              </div>

              <div className="flex flex-col gap-5 w-full">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 pl-1">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Alessandro Silva"
                      className="w-full bg-card/50 border border-foreground/10 text-foreground rounded-xl px-5 py-4 pl-12 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-foreground/20"
                    />
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/30" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 pl-1">
                    Localização Principal
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Ex: São Paulo, SP"
                      className="w-full bg-card/50 border border-foreground/10 text-foreground rounded-xl px-5 py-4 pl-12 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-foreground/20"
                    />
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/30" />
                  </div>
                </div>
              </div>
            </main>

            <div className="relative z-50 w-full p-6 pb-10 bg-gradient-to-t from-background via-background to-transparent">
              <button
                onClick={handleStep1Next}
                disabled={saving}
                className="w-full h-14 rounded-full bg-primary text-primary-foreground font-bold text-lg uppercase tracking-wider hover:opacity-90 transition-all active:scale-[0.98] neon-glow flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><span>PRÓXIMO</span><ArrowRight className="h-5 w-5" /></>}
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <main className="relative flex-1 flex flex-col w-full px-6 pt-6 pb-8 z-10 overflow-y-auto no-scrollbar">
              <div className="flex flex-col mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
                  O que te <br />
                  <span className="text-primary text-glow">interessa?</span>
                </h1>
                <p className="text-muted-foreground text-base leading-relaxed">
                  Escolha as categorias que mais te interessam. Isso personaliza sua experiência.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full">
                {categories.map((cat) => {
                  const isSelected = selected.includes(cat.label);
                  return (
                    <div
                      key={cat.label}
                      onClick={() => toggleCategory(cat.label)}
                      className={`group relative rounded-2xl bg-card cursor-pointer transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-3 px-4 py-4 ${
                        isSelected
                          ? "border border-primary ring-1 ring-primary/50 neon-border-glow"
                          : "border border-foreground/5 hover:border-foreground/20"
                      }`}
                    >
                      <span className={`text-2xl ${isSelected ? "filter drop-shadow-lg" : "opacity-80 group-hover:opacity-100 transition-opacity"}`}>
                        {cat.emoji}
                      </span>
                      <span className={`text-sm tracking-wide flex-1 ${isSelected ? "font-semibold text-foreground" : "font-medium text-foreground/60 group-hover:text-foreground transition-colors"}`}>
                        {cat.label}
                      </span>
                      <div className={`transition-opacity ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                        {isSelected ? (
                          <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                          </div>
                        ) : (
                          <div className="h-5 w-5 rounded-full border border-foreground/30" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {selected.length > 0 && (
                <motion.p
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-sm text-muted-foreground mt-6"
                >
                  {selected.length} {selected.length === 1 ? "categoria selecionada" : "categorias selecionadas"}
                </motion.p>
              )}
            </main>

            <div className="relative z-50 w-full p-6 pb-10 bg-gradient-to-t from-background via-background to-transparent">
              <button
                onClick={handleStep2Next}
                disabled={saving || selected.length === 0}
                className="w-full h-14 rounded-full bg-primary text-primary-foreground font-bold text-lg uppercase tracking-wider hover:opacity-90 transition-all active:scale-[0.98] neon-glow flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><span>PRÓXIMO</span><ArrowRight className="h-5 w-5" /></>}
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <main className="relative flex-1 flex flex-col items-center justify-center w-full px-6 pt-6 pb-8 z-10">
              {/* Celebration animation */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                className="relative mb-8"
              >
                <div className="h-28 w-28 rounded-full bg-primary/10 flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.3 }}
                  >
                    <Sparkles className="h-14 w-14 text-primary" />
                  </motion.div>
                </div>
                {/* Floating particles */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute h-2 w-2 rounded-full bg-primary/60"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0],
                      x: [0, (i % 2 === 0 ? 1 : -1) * (40 + i * 15)],
                      y: [0, -(30 + i * 10)],
                    }}
                    transition={{ duration: 1.5, delay: 0.5 + i * 0.1, ease: "easeOut" }}
                    style={{ top: "50%", left: "50%" }}
                  />
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center mb-12"
              >
                <h1 className="text-4xl font-bold tracking-tight text-foreground mb-3">
                  Tudo <span className="text-primary text-glow">pronto!</span>
                </h1>
                <p className="text-muted-foreground text-lg leading-relaxed max-w-xs mx-auto">
                  Seu perfil está configurado. Agora é hora de descobrir trocas incríveis.
                </p>
              </motion.div>
            </main>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="relative z-50 w-full p-6 pb-10 flex flex-col gap-3"
            >
              <button
                onClick={() => handleFinish("explorar")}
                disabled={saving}
                className="w-full h-14 rounded-full bg-primary text-primary-foreground font-bold text-lg uppercase tracking-wider hover:opacity-90 transition-all active:scale-[0.98] neon-glow flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><span>EXPLORAR TROCAS</span><Rocket className="h-5 w-5" /></>}
              </button>
              <button
                onClick={() => handleFinish("novo-item")}
                disabled={saving}
                className="w-full h-12 rounded-full bg-card border border-foreground/10 text-foreground font-semibold text-base hover:bg-card/80 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Package className="h-4 w-4 text-primary" />
                <span>Cadastrar meu primeiro item</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Perfil;
