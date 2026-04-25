import { ArrowRight, Handshake } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, forwardRef } from "react";
import NeonButton from "@/components/NeonButton";
import ps5Image from "@/assets/ps5-hero.png";
import notebookImage from "@/assets/notebook-hero.png";
import headphonesImage from "@/assets/headphones-hero.png";
import sneakerImage from "@/assets/sneaker-hero.png";
import cameraImage from "@/assets/camera-hero.png";
import bikeImage from "@/assets/bike-hero.png";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.12, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

type ProductCard = {
  image: string;
  name: string;
  price: string;
  category: string;
};

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
  [
    { image: notebookImage, name: "MacBook Air", price: "R$ 7.500", category: "Eletrônicos" },
    { image: ps5Image, name: "PS5 + Jogos", price: "R$ 7.200", category: "Games" },
  ],
];

const CYCLE_MS = 5500;

const cardVariants = {
  enterLeft: {
    opacity: 0,
    x: -60,
    y: 30,
    scale: 0.88,
    rotateZ: 8,
  },
  enterRight: {
    opacity: 0,
    x: 60,
    y: 30,
    scale: 0.88,
    rotateZ: -8,
  },
  centerLeft: {
    opacity: 1,
    x: -20,
    y: 0,
    scale: 1,
    rotateZ: -5,
    rotateY: 8,
    rotateX: 2,
    transition: { type: "spring" as const, stiffness: 180, damping: 22, mass: 0.8 },
  },
  centerRight: {
    opacity: 1,
    x: 20,
    y: 0,
    scale: 1,
    rotateZ: 5,
    rotateY: -8,
    rotateX: 2,
    transition: { type: "spring" as const, stiffness: 180, damping: 22, mass: 0.8, delay: 0.08 },
  },
  exitLeft: {
    opacity: 0,
    x: -200,
    rotateZ: -18,
    scale: 0.85,
    transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] as const },
  },
  exitRight: {
    opacity: 0,
    x: 200,
    rotateZ: 18,
    scale: 0.85,
    transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] as const },
  },
};

const ProductCardEl = forwardRef<HTMLDivElement, { card: ProductCard }>(({ card }, ref) => (
  <div ref={ref} className="glass-card rounded-2xl overflow-hidden shadow-2xl" style={{ width: 136 }}>
    <div className="h-[145px] flex items-center justify-center overflow-hidden bg-white">
      <img src={card.image} alt={card.name} className="w-full h-full object-contain" width={512} height={512} loading="lazy" />
    </div>
    <div className="p-2 space-y-1">
      <p className="text-foreground text-xs font-semibold leading-tight">{card.name}</p>
      <p className="text-primary text-[11px] font-bold">{card.price}</p>
      <span className="inline-block px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-medium">
        {card.category}
      </span>
    </div>
  </div>
));
ProductCardEl.displayName = "ProductCardEl";

const Index = () => {
  const navigate = useNavigate();
  const [pairIndex, setPairIndex] = useState(0);

  const nextPair = useCallback(() => {
    setPairIndex((prev) => (prev + 1) % productPairs.length);
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      timer = setInterval(nextPair, CYCLE_MS);
    };
    const stop = () => {
      if (timer) { clearInterval(timer); timer = null; }
    };

    const onVisChange = () => {
      if (document.hidden) stop();
      else start();
    };

    start();
    document.addEventListener("visibilitychange", onVisChange);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisChange);
    };
  }, [nextPair]);

  const currentPair = productPairs[pairIndex];

  return (
    <div className="dark relative min-h-screen flex flex-col justify-between overflow-hidden bg-background">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 60% 50% at 50% 35%, hsl(184 100% 50% / 0.18) 0%, transparent 70%),
              radial-gradient(ellipse 40% 35% at 45% 32%, hsl(184 100% 60% / 0.10) 0%, transparent 50%),
              radial-gradient(ellipse 45% 40% at 55% 45%, hsl(270 60% 50% / 0.06) 0%, transparent 50%)
            `,
          }}
        />
        <div className="absolute bottom-0 h-[40%] w-full bg-gradient-to-t from-background via-background/90 to-transparent" />
      </div>

      {/* Main Content */}
      <div className="relative z-20 flex flex-col items-center w-full px-6 pb-10 text-center pt-[12%]">
        <motion.div
          initial="hidden"
          animate="visible"
          className="mb-4 space-y-5 flex flex-col items-center"
        >
          {/* Badge */}
          <motion.div custom={0} variants={fadeUp}>
            <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary/5 border border-primary/15 backdrop-blur-md w-fit">
              <span className="w-1 h-1 rounded-full bg-primary/60 mr-1.5 animate-pulse" />
              <span className="text-primary/70 text-[9px] font-medium tracking-widest uppercase">
                Troque, economize e conquiste
              </span>
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            custom={1}
            variants={fadeUp}
            className="text-foreground text-[42px] leading-[1.05] font-extrabold tracking-tight"
          >
            Bem-vindo ao{" "}
            <span className="gradient-text">Hypou</span>
          </motion.h1>
        </motion.div>

        {/* Product Cards - Animated Swipe Showcase */}
        <div className="relative z-10 flex items-start justify-center mb-4 mt-4" style={{ perspective: "800px" }}>
          <div className="relative w-[260px] h-[220px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={pairIndex}
                className="absolute inset-0"
                initial="enter"
                animate="center"
                exit="exit"
              >
                {/* Left card */}
                <motion.div
                  className="absolute"
                  style={{
                    left: "0%",
                    top: 0,
                    zIndex: 2,
                    transformStyle: "preserve-3d",
                  }}
                  variants={{
                    enter: cardVariants.enterLeft,
                    center: cardVariants.centerLeft,
                    exit: cardVariants.exitLeft,
                  }}
                >
                  <ProductCardEl card={currentPair[0]} />
                </motion.div>

                {/* Right card */}
                <motion.div
                  className="absolute"
                  style={{
                    left: "40%",
                    top: 12,
                    zIndex: 1,
                    transformStyle: "preserve-3d",
                  }}
                  variants={{
                    enter: cardVariants.enterRight,
                    center: cardVariants.centerRight,
                    exit: cardVariants.exitRight,
                  }}
                >
                  <ProductCardEl card={currentPair[1]} />
                </motion.div>
              </motion.div>
            </AnimatePresence>

            {/* Handshake icon - pulses on transition */}
            <motion.div
              className="absolute z-10 flex items-center justify-center"
              style={{ left: "46%", top: "35%" }}
              initial={{ opacity: 0, scale: 0.5, x: "-50%" }}
              animate={{ opacity: 1, scale: 1, x: "-50%" }}
              transition={{ delay: 0.8, duration: 0.5, type: "spring" as const, stiffness: 200 }}
            >
              <motion.div
                key={`shake-${pairIndex}`}
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 15, -15, 0],
                }}
                transition={{
                  duration: 0.6,
                  ease: "easeInOut",
                  times: [0, 0.3, 0.6, 1],
                }}
              >
                <div className="bg-primary text-primary-foreground rounded-full p-2.5 border-[5px] border-background shadow-lg shadow-primary/30">
                  <Handshake className="h-5 w-5" />
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Description */}
        <motion.p
          initial="hidden"
          animate="visible"
          custom={2}
          variants={fadeUp}
          className="text-muted-foreground text-[14px] font-light leading-relaxed max-w-xs mb-8 mt-4"
        >
          Troque o que tá parado por algo que você quer. Dê match, negocie e faça trocas de forma segura.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-3.5 w-full max-w-xs"
        >
          <motion.div custom={3} variants={fadeUp}>
            <NeonButton variant="primary" icon={ArrowRight} onClick={() => navigate("/cadastro")}>
              Criar conta
            </NeonButton>
          </motion.div>
          <motion.div custom={4} variants={fadeUp}>
            <NeonButton variant="outline" onClick={() => navigate("/login")}>
              Entrar
            </NeonButton>
          </motion.div>
        </motion.div>

        {/* Footer Links */}
        <motion.div
          custom={5}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-10 flex justify-center gap-6 text-[11px] text-muted-foreground/50 font-medium tracking-wide"
        >
          <span className="cursor-default">Termos de Uso</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/20 my-auto" />
          <span className="cursor-default">Política de Privacidade</span>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
