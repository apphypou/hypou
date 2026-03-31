import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, ArrowRight, Heart, ChevronUp, Search, Repeat } from "lucide-react";

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  position: "center" | "bottom";
}

const STEPS: TourStep[] = [
  {
    title: "Bem-vindo ao Explorar!",
    description: "Aqui você descobre itens de outros usuários e pode propor trocas.",
    icon: <Search className="h-7 w-7 text-primary" />,
    position: "center",
  },
  {
    title: "Arraste para os lados",
    description: "Arraste o card para a direita para curtir ou para a esquerda para passar.",
    icon: (
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1.5 text-destructive/80">
          <ArrowLeft className="h-5 w-5" />
          <X className="h-5 w-5" />
        </div>
        <div className="h-6 w-px bg-foreground/10" />
        <div className="flex items-center gap-1.5 text-primary">
          <Heart className="h-5 w-5" />
          <ArrowRight className="h-5 w-5" />
        </div>
      </div>
    ),
    position: "center",
  },
  {
    title: "Veja os detalhes",
    description: "Arraste o card para cima ou toque em 'Detalhes' para ver mais informações do item.",
    icon: <ChevronUp className="h-7 w-7 text-primary" />,
    position: "bottom",
  },
  {
    title: "Proponha uma troca",
    description: "Ao curtir, escolha um dos seus itens para enviar uma proposta de troca!",
    icon: <Repeat className="h-7 w-7 text-primary" />,
    position: "center",
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
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative mx-6 max-w-sm w-full rounded-3xl bg-card border border-foreground/10 p-6 shadow-2xl"
        >
          {/* Close */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 h-8 w-8 rounded-full bg-foreground/5 flex items-center justify-center text-foreground/40 hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Step indicator */}
          <div className="flex items-center gap-1.5 mb-6">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === step ? "w-8 bg-primary" : i < step ? "w-4 bg-primary/40" : "w-4 bg-foreground/10"
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              {current.icon}
            </div>
          </div>

          {/* Content */}
          <h3 className="text-lg font-bold text-foreground text-center mb-2">
            {current.title}
          </h3>
          <p className="text-sm text-muted-foreground text-center mb-6 leading-relaxed">
            {current.description}
          </p>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handlePrev}
              disabled={step === 0}
              className="h-10 px-4 rounded-full bg-foreground/5 text-foreground/60 text-sm font-medium transition-all disabled:opacity-0 disabled:pointer-events-none hover:bg-foreground/10"
            >
              Voltar
            </button>
            <button
              onClick={handleNext}
              className="h-10 px-6 rounded-full bg-primary text-primary-foreground text-sm font-bold transition-all hover:opacity-90"
            >
              {step === STEPS.length - 1 ? "Começar!" : "Próximo"}
            </button>
          </div>

          {/* Skip */}
          <button
            onClick={handleClose}
            className="w-full mt-3 text-xs text-foreground/30 hover:text-foreground/50 transition-colors text-center"
          >
            Pular tutorial
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingTour;
