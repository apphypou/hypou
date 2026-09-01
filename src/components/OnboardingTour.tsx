import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftRight, ArrowRight, ChevronLeft, MessageCircle, Search, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { getProfile, updateProfile } from "@/services/profileService";

const STEPS = [
  {
    icon: Search,
    label: "Explore",
    title: "Explore novas possibilidades",
    description: "Veja itens de pessoas perto de você e encontre algo que vale uma troca.",
  },
  {
    icon: ArrowLeftRight,
    label: "Dê Hypou",
    title: "Dê Hypou no que interessa",
    description: "Escolha os itens que combinam com você. O restante segue para o próximo.",
  },
  {
    icon: MessageCircle,
    label: "Proponha",
    title: "Sua troca começa aqui",
    description: "Envie uma proposta e combine todos os detalhes pelo chat.",
  },
];

const OnboardingTour = ({ userId }: { userId: string }) => {
  const [dismissed, setDismissed] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ["product-tour", userId],
    queryFn: () => getProfile(userId),
    staleTime: Infinity,
  });

  const complete = () => {
    setDismissed(true);
    void updateProfile(userId, { product_tour_completed_at: new Date().toISOString() });
  };

  if (isLoading || isError || dismissed || profile?.product_tour_completed_at) return null;

  const step = STEPS[stepIndex];
  const Icon = step.icon;
  const isLastStep = stepIndex === STEPS.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020711]/80 px-5 backdrop-blur-sm"
      >
        <motion.section
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-tour-title"
          className="relative w-full max-w-[22rem] overflow-hidden rounded-[28px] border border-primary/20 bg-card shadow-[0_24px_80px_rgba(0,0,0,0.7)]"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5" aria-label={`${stepIndex + 1} de ${STEPS.length}`}>
                {STEPS.map((item, index) => (
                  <span key={item.label} className={`h-1.5 rounded-full transition-all ${index === stepIndex ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/35"}`} />
                ))}
                <span className="ml-1.5 text-[11px] font-semibold text-muted-foreground">{stepIndex + 1} de {STEPS.length}</span>
              </div>
              <button type="button" onClick={complete} className="text-xs font-semibold text-muted-foreground transition hover:text-foreground">
                Pular
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={step.label}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                className="pt-5"
              >
                <div className="relative flex h-36 items-center justify-center overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/15 via-background to-card">
                  <div className="absolute h-28 w-52 rounded-[24px] border border-primary/20 bg-card/90 shadow-[0_12px_32px_rgba(0,0,0,0.35)]" />
                  <div className="relative flex items-center gap-3 rounded-2xl border border-primary/25 bg-background/70 px-4 py-3 backdrop-blur-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.35)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{stepIndex === 2 ? "Proposta de troca" : stepIndex === 1 ? "Escolha com intenção" : "Itens perto de você"}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{stepIndex === 2 ? "Itens + chat, em um só lugar" : stepIndex === 1 ? "O que você quer receber" : "Descubra algo novo hoje"}</p>
                    </div>
                  </div>
                  {stepIndex === 2 && <Sparkles className="absolute right-8 top-5 h-4 w-4 text-primary" />}
                </div>

                <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">{step.label}</p>
                <h2 id="onboarding-tour-title" className="mt-2 text-[25px] font-extrabold leading-tight tracking-tight text-foreground">
                  {step.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </motion.div>
            </AnimatePresence>

            <div className="mt-6 flex items-center gap-3">
              {stepIndex > 0 ? (
                <button type="button" onClick={() => setStepIndex((current) => current - 1)} aria-label="Voltar" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-foreground/10 text-foreground transition hover:bg-foreground/5">
                  <ChevronLeft className="h-5 w-5" />
                </button>
              ) : <div className="w-12 shrink-0" />}
              <button
                type="button"
                onClick={() => isLastStep ? complete() : setStepIndex((current) => current + 1)}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-primary text-sm font-extrabold text-primary-foreground shadow-[0_0_24px_hsl(var(--primary)/0.28)] transition hover:brightness-110 active:scale-[0.98]"
              >
                {isLastStep ? "Começar a explorar" : "Continuar"} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingTour;
