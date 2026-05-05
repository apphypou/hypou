import { useEffect, useMemo, useRef, useState, useCallback, forwardRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ArrowDown, Handshake, Sparkles } from "lucide-react";
import StoreBadge from "@/components/landing/StoreBadge";
import landingLogo from "@/assets/hypou-landing-logo.png";
import HowItWorks from "@/components/landing/HowItWorks";
import Differentials from "@/components/landing/Differentials";
import StatsCounter from "@/components/landing/StatsCounter";
import LandingFooter from "@/components/landing/LandingFooter";
import { APP_STORE_URL, PLAY_STORE_URL, detectPlatform } from "@/config/storeLinks";

import ps5Image from "@/assets/ps5-hero.png";
import notebookImage from "@/assets/notebook-hero.png";
import headphonesImage from "@/assets/headphones-hero.png";
import sneakerImage from "@/assets/sneaker-hero.png";
import cameraImage from "@/assets/camera-hero.png";
import bikeImage from "@/assets/bike-hero.png";

type ProductCard = { image: string; name: string; price: string; category: string };
type ProductPair = [ProductCard, ProductCard];

const productPairs: ProductPair[] = [
  [
    { image: ps5Image, name: "PS5 Pro", price: "R$ 4.500", category: "Games" },
    { image: notebookImage, name: "Notebook Samsung", price: "R$ 4.200", category: "Eletrônicos" },
  ],
  [
    { image: headphonesImage, name: "Fone Bluetooth", price: "R$ 850", category: "Áudio" },
    { image: sneakerImage, name: "Tênis Nike", price: "R$ 900", category: "Moda" },
  ],
  [
    { image: bikeImage, name: "Bike Caloi", price: "R$ 2.100", category: "Esportes" },
    { image: cameraImage, name: "Câmera Canon", price: "R$ 2.300", category: "Fotografia" },
  ],
];

const CYCLE_MS = 5500;

const ProductCardEl = forwardRef<HTMLDivElement, { card: ProductCard }>(({ card }, ref) => (
  <div ref={ref} className="glass-card rounded-2xl overflow-hidden shadow-2xl" style={{ width: 150 }}>
    <div className="h-[160px] flex items-center justify-center overflow-hidden bg-white">
      <img src={card.image} alt={card.name} className="w-full h-full object-contain" loading="lazy" />
    </div>
    <div className="p-2.5 space-y-1">
      <p className="text-foreground text-xs font-semibold leading-tight">{card.name}</p>
      <p className="text-primary text-[11px] font-bold">{card.price}</p>
      <span className="inline-block px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-medium">
        {card.category}
      </span>
    </div>
  </div>
));
ProductCardEl.displayName = "ProductCardEl";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.1 + i * 0.1, duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const Baixar = () => {
  const [pairIndex, setPairIndex] = useState(0);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");
  const heroRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const mockupY = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : -60]);
  const mockupOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.3]);

  const nextPair = useCallback(() => {
    setPairIndex((p) => (p + 1) % productPairs.length);
  }, []);

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

  useEffect(() => {
    const id = setInterval(nextPair, CYCLE_MS);
    const onVis = () => {
      if (document.hidden) clearInterval(id);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [nextPair]);

  const currentPair = productPairs[pairIndex];
  const showAppleHighlight = platform === "ios" || platform === "desktop";
  const showGoogleHighlight = platform === "android";

  const qrUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const target = encodeURIComponent(`${window.location.origin}/baixar`);
    return `https://api.qrserver.com/v1/create-qr-code/?data=${target}&size=160x160&bgcolor=1c1c1c&color=18FDF6&margin=4`;
  }, []);

  return (
    <div className="dark min-h-screen bg-background text-foreground antialiased font-display">
      {/* HERO */}
      <section ref={heroRef} className="relative overflow-hidden px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        {/* Mesh gradient bg */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 70% 55% at 50% 30%, hsl(184 100% 50% / 0.22) 0%, transparent 70%),
                radial-gradient(ellipse 45% 40% at 60% 50%, hsl(270 60% 50% / 0.10) 0%, transparent 60%)
              `,
            }}
          />
          <div className="absolute bottom-0 h-[50%] w-full bg-gradient-to-t from-background via-background/90 to-transparent" />
        </div>

        <nav className="mx-auto mb-12 flex max-w-5xl items-center justify-between">
          <HypouLogo size="md" as="h1" />
          <a
            href="#download"
            className="hidden rounded-full border border-foreground/10 bg-foreground/5 px-4 py-1.5 text-xs font-medium text-foreground/80 backdrop-blur-md transition-colors hover:border-primary/30 hover:text-primary md:inline-block"
          >
            Baixar app
          </a>
        </nav>

        <div className="mx-auto grid max-w-5xl items-center gap-12 md:grid-cols-2">
          {/* Copy */}
          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <motion.div custom={0} initial="hidden" animate="visible" variants={fadeUp}>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 backdrop-blur-md">
                <Sparkles className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-medium uppercase tracking-widest text-primary/80">
                  Disponível agora
                </span>
              </div>
            </motion.div>

            <motion.h2
              custom={1}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="mt-5 text-[40px] font-extrabold leading-[1.05] tracking-tight md:text-[56px]"
            >
              Troque o que tá parado.{" "}
              <span className="gradient-text">Hypou</span> o que você quer.
            </motion.h2>

            <motion.p
              custom={2}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="mt-5 max-w-md text-base font-light leading-relaxed text-muted-foreground md:text-lg"
            >
              Match de objetos, não de pessoas. Negocie no chat seguro, com preço justo validado por IA.{" "}
              <span className="text-foreground/90 font-medium">100% grátis.</span>
            </motion.p>

            <motion.div
              custom={3}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              id="download"
              className="mt-8 flex flex-col items-center gap-3 sm:flex-row md:items-start"
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
                className="mt-6 flex items-center gap-3 text-left"
              >
                <div className="rounded-xl border border-foreground/10 bg-foreground/5 p-1.5 backdrop-blur-md">
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
                <div>
                  <p className="text-xs font-semibold text-foreground">Aponte a câmera</p>
                  <p className="text-[11px] text-muted-foreground">Abra o Hypou direto no seu celular</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Mockup / showcase */}
          <motion.div
            style={{ y: mockupY, opacity: mockupOpacity }}
            className="relative mx-auto flex h-[340px] w-full max-w-sm items-start justify-center md:h-[420px]"
          >
            <div className="relative w-[280px] h-[260px]" style={{ perspective: "800px" }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={pairIndex}
                  className="absolute inset-0"
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  <motion.div
                    className="absolute"
                    style={{ left: "0%", top: 0, zIndex: 2, transformStyle: "preserve-3d" }}
                    variants={{
                      enter: { opacity: 0, x: -60, y: 30, scale: 0.88, rotateZ: 8 },
                      center: {
                        opacity: 1, x: -20, y: 0, scale: 1, rotateZ: -5, rotateY: 8,
                        transition: { type: "spring", stiffness: 180, damping: 22 },
                      },
                      exit: { opacity: 0, x: -200, rotateZ: -18, scale: 0.85, transition: { duration: 0.55 } },
                    }}
                  >
                    <ProductCardEl card={currentPair[0]} />
                  </motion.div>

                  <motion.div
                    className="absolute"
                    style={{ left: "44%", top: 12, zIndex: 1, transformStyle: "preserve-3d" }}
                    variants={{
                      enter: { opacity: 0, x: 60, y: 30, scale: 0.88, rotateZ: -8 },
                      center: {
                        opacity: 1, x: 20, y: 0, scale: 1, rotateZ: 5, rotateY: -8,
                        transition: { type: "spring", stiffness: 180, damping: 22, delay: 0.08 },
                      },
                      exit: { opacity: 0, x: 200, rotateZ: 18, scale: 0.85, transition: { duration: 0.55 } },
                    }}
                  >
                    <ProductCardEl card={currentPair[1]} />
                  </motion.div>
                </motion.div>
              </AnimatePresence>

              <motion.div
                className="absolute z-10 flex items-center justify-center"
                style={{ left: "50%", top: "38%" }}
                initial={{ opacity: 0, scale: 0.5, x: "-50%" }}
                animate={{ opacity: 1, scale: 1, x: "-50%" }}
                transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
              >
                <motion.div
                  key={`shake-${pairIndex}`}
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                >
                  <div className="rounded-full border-[5px] border-background bg-primary p-3 text-primary-foreground shadow-[0_0_30px_-5px_hsl(var(--primary)/0.6)]">
                    <Handshake className="h-6 w-6" />
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-16 flex justify-center md:mt-20"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-foreground/10 bg-foreground/5 text-muted-foreground backdrop-blur-md"
          >
            <ArrowDown className="h-4 w-4" />
          </motion.div>
        </motion.div>
      </section>

      <HowItWorks />
      <StatsCounter />
      <Differentials />

      {/* CTA final */}
      <section className="relative overflow-hidden px-6 py-24">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 60% 60% at 50% 50%, hsl(184 100% 50% / 0.18) 0%, transparent 70%),
                radial-gradient(ellipse 40% 40% at 30% 50%, hsl(270 60% 50% / 0.10) 0%, transparent 60%)
              `,
            }}
          />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl">
            Pronto pra dar o seu primeiro <span className="gradient-text">Hypou</span>?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm text-muted-foreground md:text-base">
            Baixe grátis e descubra trocas perto de você em segundos.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
