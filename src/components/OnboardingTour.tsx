import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronUp, Search, Repeat, Heart, Package } from "lucide-react";
import tutorialSwipeImg from "@/assets/tutorial-swipe.png";

interface TourStep {
  title: string;
  description: string;
  visual: "intro" | "swipe" | "details" | "trade";
  cta?: string;
  needsSwipe?: boolean;
}

const STEPS: TourStep[] = [
  {
    title: "Troque o que está parado",
    description: "Veja itens reais de outras pessoas e descubra oportunidades de troca perto de você.",
    visual: "intro",
    cta: "Entendi",
  },
  {
    title: "Curta ou passe",
    description: "Arraste o mini card para aprender: direita é Hypou, esquerda é Flopou.",
    visual: "swipe",
    needsSwipe: true,
  },
  {
    title: "Veja antes de propor",
    description: "Toque no preço ou na área do item para abrir detalhes, descrição e anunciante.",
    visual: "details",
    cta: "Ver exemplo",
  },
  {
    title: "Proponha com um item seu",
    description: "Quando combinar, escolha seu item, envie a proposta e combine tudo pelo chat.",
    visual: "trade",
    cta: "Começar!",
  },
];

const TOUR_KEY = "hypou_onboarding_tour_completed";

interface OnboardingTourProps {
  onComplete?: () => void;
}

const OnboardingTour = ({ onComplete }: OnboardingTourProps) => {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [swipeResult, setSwipeResult] = useState<"hypou" | "flopou" | null>(null);

  useEffect(() => {
    const done = localStorage.getItem(TOUR_KEY);
    if (!done) setVisible(true);
  }, []);

  useEffect(() => {
    setSwipeResult(null);
  }, [step]);

  const handleClose = () => {
    localStorage.setItem(TOUR_KEY, "true");
    setVisible(false);
    onComplete?.();
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  if (!visible) return null;

  const current = STEPS[step];
  const canContinue = !current.needsSwipe || !!swipeResult;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-scrim/70 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 24 }}
          transition={{ type: "spring", stiffness: 340, damping: 28 }}
          className="relative mx-6 max-w-[340px] w-full rounded-3xl bg-card/95 backdrop-blur-xl border border-on-media/[0.06] p-7 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.5)]"
        >
          {/* Close */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 h-8 w-8 rounded-full bg-foreground/[0.06] flex items-center justify-center text-foreground/30 hover:text-foreground/60 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Step dots */}
          <div className="flex items-center gap-1.5 mb-8">
            {STEPS.map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  width: i === step ? 28 : 14,
                  opacity: i === step ? 1 : i < step ? 0.5 : 0.15,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className={`h-[3px] rounded-full ${
                  i <= step ? "bg-primary" : "bg-foreground"
                }`}
              />
            ))}
          </div>

          {/* Visual area */}
          <div className="flex justify-center mb-5">
            <StepVisual visual={current.visual} result={swipeResult} onSwipe={setSwipeResult} />
          </div>

          {/* Content */}
          <motion.h3
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-lg font-bold text-foreground text-center mb-2"
          >
            {current.title}
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm text-muted-foreground text-center mb-8 leading-relaxed"
          >
            {current.description}
          </motion.p>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrev}
              disabled={step === 0}
              className="flex-1 h-12 rounded-full bg-foreground/[0.06] text-foreground/70 text-sm font-semibold transition-all disabled:opacity-0 disabled:pointer-events-none hover:bg-foreground/10 active:scale-95"
            >
              Voltar
            </button>
            <button
              onClick={handleNext}
              disabled={!canContinue}
              className="flex-1 h-12 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.4)] transition-all hover:shadow-[0_4px_24px_-2px_hsl(var(--primary)/0.5)] active:scale-95 disabled:opacity-45 disabled:shadow-none disabled:active:scale-100"
            >
              {current.needsSwipe && !swipeResult ? "Arraste o card" : current.cta || "Próximo"}
            </button>
          </div>

          {/* Skip */}
          <button
            onClick={handleClose}
            className="w-full mt-4 text-xs text-foreground/25 hover:text-foreground/50 transition-colors text-center"
          >
            Pular tutorial
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const StepVisual = ({
  visual,
  result,
  onSwipe,
}: {
  visual: TourStep["visual"];
  result: "hypou" | "flopou" | null;
  onSwipe: (value: "hypou" | "flopou") => void;
}) => {
  if (visual === "swipe") {
    return (
      <div className="relative h-[118px] w-[190px]">
        <div className="absolute inset-x-2 top-8 flex justify-between text-[10px] font-bold uppercase tracking-wider">
          <span className="text-destructive/80">Flopou</span>
          <span className="text-primary">Hypou</span>
        </div>
        <motion.div
          drag="x"
          dragConstraints={{ left: -62, right: 62 }}
          dragElastic={0.12}
          onDragEnd={(_, info) => {
            if (info.offset.x > 35) onSwipe("hypou");
            if (info.offset.x < -35) onSwipe("flopou");
          }}
          animate={{ x: result === "hypou" ? 42 : result === "flopou" ? -42 : 0, rotate: result === "hypou" ? 7 : result === "flopou" ? -7 : 0 }}
          style={{ left: "calc(50% - 43px)" }}
          className="absolute top-2 h-[104px] w-[86px] rounded-2xl bg-gradient-to-br from-zinc-700 to-zinc-950 border border-white/12 shadow-2xl flex flex-col justify-end p-2 touch-pan-y"
        >
          <img
            src={tutorialSwipeImg}
            alt=""
            className="absolute inset-0 h-full w-full rounded-2xl object-cover opacity-60"
            draggable={false}
          />
          <div className="relative h-2 w-10 rounded-full bg-white/80" />
          <div className="relative mt-1 h-1.5 w-8 rounded-full bg-white/40" />
        </motion.div>
        {result && (
          <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-bold ${result === "hypou" ? "bg-primary text-primary-foreground" : "bg-destructive text-destructive-foreground"}`}>
            {result === "hypou" ? "Hypou" : "Flopou"}
          </div>
        )}
      </div>
    );
  }

  const icon =
    visual === "intro" ? <Search className="h-7 w-7 text-primary" /> :
    visual === "details" ? <ChevronUp className="h-7 w-7 text-primary" /> :
    <Repeat className="h-7 w-7 text-primary" />;

  return (
    <div className="h-[104px] w-[176px] rounded-2xl bg-gradient-to-br from-primary/[0.14] to-primary/[0.04] border border-primary/[0.12] flex items-center justify-center overflow-hidden p-3">
      {visual === "trade" ? (
        <div className="flex items-center gap-2">
          <Package className="h-8 w-8 text-primary" />
          <Repeat className="h-6 w-6 text-primary/70" />
          <Heart className="h-8 w-8 text-primary" />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          {icon}
          {visual === "details" && <div className="h-2 w-16 rounded-full bg-primary/35" />}
          {visual === "intro" && <div className="h-2 w-20 rounded-full bg-primary/30" />}
        </div>
      )}
    </div>
  );
};

export default OnboardingTour;
