import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, ArrowDown } from "lucide-react";
import HypouLogo from "@/components/HypouLogo";
import StoreBadge from "@/components/landing/StoreBadge";
import HowItWorks from "@/components/landing/HowItWorks";
import SocialProof from "@/components/landing/SocialProof";
import Differentials from "@/components/landing/Differentials";
import StatsCounter from "@/components/landing/StatsCounter";
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
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <HypouLogo size="md" as="h1" />
          <a
            href="#download"
            className="rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground transition-all hover:scale-105 hover:shadow-[0_0_20px_-4px_hsl(var(--primary)/0.6)]"
          >
            Baixar grátis
          </a>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden px-6 pt-16 pb-24 md:pt-24 md:pb-32">
        {/* Rich mesh */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 60% 50% at 20% 20%, hsl(184 100% 50% / 0.35) 0%, transparent 60%),
                radial-gradient(ellipse 55% 45% at 80% 30%, hsl(270 80% 55% / 0.22) 0%, transparent 60%),
                radial-gradient(ellipse 70% 60% at 60% 80%, hsl(184 100% 50% / 0.18) 0%, transparent 65%),
                radial-gradient(ellipse 40% 35% at 30% 70%, hsl(310 70% 55% / 0.12) 0%, transparent 60%)
              `,
            }}
          />
          {/* grain */}
          <div
            className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
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
              className="mt-6 text-[44px] font-extrabold leading-[1.02] tracking-tight md:text-[64px] lg:text-[72px]"
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
              className="mt-10 flex flex-col items-center gap-3 sm:flex-row lg:items-start"
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
              className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground lg:justify-start"
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
            className="relative mx-auto h-[520px] w-full max-w-[520px] md:h-[620px]"
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

      {/* CTA final */}
      <section className="relative overflow-hidden px-6 py-28">
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
          <h2 className="text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
            Pronto pra dar o seu primeiro <span className="gradient-text">Hypou</span>?
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-base text-muted-foreground md:text-lg">
            Baixe grátis e descubra trocas perto de você em segundos.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
