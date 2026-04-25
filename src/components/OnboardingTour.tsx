import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronUp, Search, Repeat } from "lucide-react";
import tutorialSwipeImg from "@/assets/tutorial-swipe.png";

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const SwipeVisual = () => (
  <img
    src={tutorialSwipeImg}
    alt="Arraste para os lados"
    className="h-full w-full object-contain"
    draggable={false}
  />
);

const STEPS: TourStep[] = [
  {
    title: "Bem-vindo ao Explorar!",
    description: "Aqui você descobre itens de outros usuários e pode propor trocas.",
    icon: <Search className="h-7 w-7 text-primary" />,
  },
  {
    title: "Arraste para os lados",
    description: "Arraste o card para a direita para curtir ou para a esquerda para passar.",
    icon: <SwipeVisual />,
  },
  {
    title: "Veja os detalhes",
    description: "Arraste o card para cima ou toque em 'Detalhes' para ver mais informações do item.",
    icon: <ChevronUp className="h-7 w-7 text-primary" />,
  },
  {
    title: "Proponha uma troca",
    description: "Ao curtir, escolha um dos seus itens para enviar uma proposta de troca!",
    icon: <Repeat className="h-7 w-7 text-primary" />,
  },
];

const TOUR_KEY = "hypou_onboarding_tour_completed";

interface OnboardingTourProps {
  onComplete?: () => void;
}

const OnboardingTour = ({ onComplete }: OnboardingTourProps) => {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(TOUR_KEY);
    if (!done) setVisible(true);
  }, []);

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

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 24 }}
          transition={{ type: "spring", stiffness: 340, damping: 28 }}
          className="relative mx-6 max-w-[340px] w-full rounded-3xl bg-card/95 backdrop-blur-xl border border-white/[0.06] p-7 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.5)]"
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

          {/* Icon area */}
          <div className="flex justify-center mb-5">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 20 }}
              className="h-[96px] w-[160px] rounded-2xl bg-gradient-to-br from-primary/[0.12] to-primary/[0.04] border border-primary/[0.08] flex items-center justify-center overflow-hidden p-2"
            >
              {current.icon}
            </motion.div>
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
              className="flex-1 h-12 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.4)] transition-all hover:shadow-[0_4px_24px_-2px_hsl(var(--primary)/0.5)] active:scale-95"
            >
              {step === STEPS.length - 1 ? "Começar!" : "Próximo"}
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

export default OnboardingTour;
