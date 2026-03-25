import { ArrowRight, Handshake } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import NeonButton from "@/components/NeonButton";
import ps5Image from "@/assets/ps5-hero.png";
import notebookImage from "@/assets/notebook-hero.png";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.12, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const cards = [
  { image: ps5Image, name: "PS5 Pro", price: "R$ 4.500", category: "Games", rotate: -5, x: -20, delay: 0.3, left: "0%" },
  { image: notebookImage, name: "Notebook Samsung", price: "R$ 3.200", category: "Eletrônicos", rotate: 5, x: 20, delay: 0.5, left: "40%" },
];

const Index = () => {
  const navigate = useNavigate();

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
                Troque com segurança
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

        {/* Product Cards */}
        <div className="relative z-10 flex items-start justify-center mb-4 mt-4" style={{ perspective: "800px" }}>
          <div className="relative w-[260px] h-[220px]">
            {cards.map((card, i) => (
              <motion.div
                key={i}
                className="absolute glass-card rounded-2xl overflow-hidden shadow-2xl"
                style={{
                  width: 136,
                  left: card.left,
                  top: i === 1 ? 12 : 0,
                  zIndex: i === 0 ? 2 : 1,
                  transformStyle: "preserve-3d",
                }}
                initial={{ opacity: 0, x: i === 0 ? -60 : 60, rotateY: i === 0 ? 15 : -15 }}
                animate={{
                  opacity: 1,
                  x: card.x,
                  rotateY: i === 0 ? 8 : -8,
                  rotateX: 2,
                  rotateZ: card.rotate,
                }}
                transition={{ delay: card.delay, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <div className="h-[100px] bg-white flex items-center justify-center overflow-hidden p-2">
                  <img src={card.image} alt={card.name} className="w-full h-full object-contain" width={512} height={512} />
                </div>
                <div className="p-2 space-y-1">
                  <p className="text-foreground text-xs font-semibold leading-tight">{card.name}</p>
                  <p className="text-primary text-[11px] font-bold">{card.price}</p>
                  <span className="inline-block px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-medium">
                    {card.category}
                  </span>
                </div>
              </motion.div>
            ))}

            {/* Handshake icon */}
            <motion.div
              className="absolute z-10 flex items-center justify-center"
              style={{ left: "42%", top: "35%" }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.5, type: "spring", stiffness: 200 }}
            >
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
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
          className="text-muted-foreground text-[17px] font-light leading-relaxed max-w-xs mb-8"
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
