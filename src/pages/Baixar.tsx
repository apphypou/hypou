import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, ArrowDown } from "lucide-react";
import hypouWordmark from "@/assets/hypou-wordmark.png";
import StoreBadge from "@/components/landing/StoreBadge";
import HowItWorks from "@/components/landing/HowItWorks";
import SocialProof from "@/components/landing/SocialProof";
import Differentials from "@/components/landing/Differentials";
import StatsCounter from "@/components/landing/StatsCounter";
import FAQ from "@/components/landing/FAQ";
import LandingFooter from "@/components/landing/LandingFooter";
import { APP_STORE_URL, PLAY_STORE_URL, detectPlatform } from "@/config/storeLinks";

import phoneExplore from "@/assets/landing-phone-explore.png";
import phoneMatch from "@/assets/landing-phone-match.png";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.1 + i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

const Baixar = () => {
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setPlatform(detectPlatform());
    document.title = "Baixe o Hypou — Troque o que tá parado";
    const meta =
      document.querySelector('meta[name="description"]') ??
      Object.assign(document.createElement("meta"), { name: "description" });
    meta.setAttribute(
      "content",
      "Baixe o Hypou grátis na App Store e Google Play. Troque objetos parados por algo que você quer, com chat seguro e validação de preço por IA."
    );
    if (!meta.parentNode) document.head.appendChild(meta);
  }, []);

  const showAppleHighlight = platform === "ios" || platform === "desktop";
  const showGoogleHighlight = platform === "android";

  const qrUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const target = encodeURIComponent(`${window.location.origin}/baixar`);
    return `https://api.qrserver.com/v1/create-qr-code/?data=${target}&size=200x200&bgcolor=ffffff&color=000000&margin=2&qzone=2`;
  }, []);

  return (
    <div className="dark min-h-screen bg-background text-foreground antialiased font-display">
      {/* Sticky header */}
      <header className="sticky top-0 z-50 border-b border-foreground/5 bg-background/70 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <h1 className="m-0 min-w-0">
            <img
              src={hypouWordmark}
              alt="Hypou"
              className="h-9 w-auto select-none sm:h-12"
              draggable={false}
            />
          </h1>
          <a
            href="#download"
            className="shrink-0 rounded-full bg-primary px-4 py-2 text-[11px] font-bold text-primary-foreground transition-all hover:scale-105 hover:shadow-[0_0_20px_-4px_hsl(var(--primary)/0.6)] sm:px-5 sm:text-xs"
          >
            Baixar grátis
          </a>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden px-5 pt-10 pb-20 sm:px-6 sm:pt-16 sm:pb-24 md:pt-24 md:pb-32">
        {/* Rich animated mesh */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <motion.div
            className="absolute -left-[10%] -top-[10%] h-[60%] w-[60%] rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, hsl(184 100% 50% / 0.55) 0%, transparent 70%)" }}
            animate={reduceMotion ? {} : { x: [0, 40, 0], y: [0, 30, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -right-[5%] top-[10%] h-[50%] w-[50%] rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, hsl(270 85% 60% / 0.45) 0%, transparent 70%)" }}
            animate={reduceMotion ? {} : { x: [0, -30, 0], y: [0, 40, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-[5%] left-[30%] h-[55%] w-[55%] rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, hsl(310 75% 55% / 0.30) 0%, transparent 70%)" }}
            animate={reduceMotion ? {} : { x: [0, 50, 0], y: [0, -20, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* grain */}
          <div
            className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
          />
          <div className="absolute bottom-0 h-[40%] w-full bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>

        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-8">
          {/* Copy */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <motion.div custom={0} initial="hidden" animate="visible" variants={fadeUp}>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-primary">
                  Disponível agora · 100% grátis
                </span>
              </div>
            </motion.div>

            <motion.h2
              custom={1}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="mt-6 text-[34px] font-extrabold leading-[1.05] tracking-tight sm:text-[44px] md:text-[64px] lg:text-[72px]"
            >
              Troque o que tá parado.
              <br />
              <span className="gradient-text">Hypou</span> o que você quer.
            </motion.h2>

            <motion.p
              custom={2}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="mt-6 max-w-md text-base font-light leading-relaxed text-muted-foreground md:text-lg"
            >
              Match de objetos, não de pessoas. Negocie no chat seguro, com preço justo validado por IA.
            </motion.p>

            <motion.div
              custom={3}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              id="download"
              className="mt-10 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center lg:items-start"
            >
              <StoreBadge store="apple" href={APP_STORE_URL} highlighted={showAppleHighlight} />
              <StoreBadge store="google" href={PLAY_STORE_URL} highlighted={showGoogleHighlight} />
            </motion.div>

            {platform === "desktop" && (
              <motion.div
                custom={4}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="mt-8 flex items-center gap-4"
              >
                <div className="rounded-2xl bg-white p-2 shadow-[0_8px_32px_-8px_hsl(var(--primary)/0.4)]">
                  {qrUrl && (
                    <img
                      src={qrUrl}
                      alt="QR code para baixar o Hypou"
                      width={88}
                      height={88}
                      className="rounded-lg"
                      loading="lazy"
                    />
                  )}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">Aponte a câmera</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Abra o Hypou no celular em segundos
                  </p>
                </div>
              </motion.div>
            )}

            {/* Trust micro-row */}
            <motion.div
              custom={5}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="mt-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground sm:gap-x-6 sm:text-xs lg:justify-start"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Sem mensalidade
              </span>
              <span className="hidden h-1 w-1 rounded-full bg-foreground/20 sm:block" />
              <span>Sem comissão</span>
              <span className="hidden h-1 w-1 rounded-full bg-foreground/20 sm:block" />
              <span>Sem golpe</span>
            </motion.div>
          </div>

          {/* Mockups reais — duas iPhones */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="relative mx-auto h-[420px] w-full max-w-[520px] sm:h-[520px] md:h-[620px]"
          >
            {/* Halo glow */}
            <div
              className="pointer-events-none absolute inset-0 -z-10 blur-3xl"
              style={{
                background:
                  "radial-gradient(ellipse 60% 50% at 50% 50%, hsl(184 100% 50% / 0.3) 0%, transparent 70%)",
              }}
            />

            {/* Phone 1 — Explore */}
            <motion.img
              src={phoneExplore}
              alt="App Hypou na tela Explorar mostrando um PS5 Pro disponível para troca"
              width={832}
              height={1664}
              className="absolute left-0 top-8 w-[58%] drop-shadow-[0_30px_60px_rgba(0,0,0,0.5)]"
              initial={{ rotate: -8 }}
              animate={reduceMotion ? {} : { rotate: -8, y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformOrigin: "center" }}
            />

            {/* Phone 2 — Match */}
            <motion.img
              src={phoneMatch}
              alt="App Hypou na tela de Match mostrando uma troca confirmada"
              width={832}
              height={1664}
              className="absolute right-0 top-0 w-[58%] drop-shadow-[0_30px_60px_rgba(0,0,0,0.6)]"
              initial={{ rotate: 8 }}
              animate={reduceMotion ? {} : { rotate: 8, y: [0, 10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              style={{ transformOrigin: "center" }}
            />
          </motion.div>
        </div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="mt-20 flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-foreground/10 bg-foreground/5 text-muted-foreground backdrop-blur-md"
          >
            <ArrowDown className="h-4 w-4" />
          </motion.div>
        </motion.div>
      </section>

      <StatsCounter />
      <HowItWorks />
      <SocialProof />
      <Differentials />
      <FAQ />

      {/* CTA final */}
      <section className="relative overflow-hidden px-5 py-20 sm:px-6 sm:py-28">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 60% 60% at 50% 50%, hsl(184 100% 50% / 0.25) 0%, transparent 70%),
                radial-gradient(ellipse 40% 40% at 30% 50%, hsl(270 70% 55% / 0.15) 0%, transparent 60%)
              `,
            }}
          />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 className="text-3xl font-extrabold leading-[1.05] tracking-tight sm:text-4xl md:text-6xl">
            Pronto pra dar o seu primeiro <span className="gradient-text">Hypou</span>?
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-sm text-muted-foreground sm:text-base md:text-lg">
            Baixe grátis e descubra trocas perto de você em segundos.
          </p>
          <div className="mt-10 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center">
            <StoreBadge store="apple" href={APP_STORE_URL} highlighted={showAppleHighlight} />
            <StoreBadge store="google" href={PLAY_STORE_URL} highlighted={showGoogleHighlight} />
          </div>
        </motion.div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default Baixar;
