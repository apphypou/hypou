import { ArrowRight, ArrowLeftRight, Headphones, Shirt, Gamepad2, Laptop } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import NeonButton from "@/components/NeonButton";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.12, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const mockCards = [
  // Row 1
  {
    icon: Headphones,
    name: "Fone Sony",
    price: "R$ 200",
    category: "Eletrônicos",
    gradient: "from-primary/40 via-primary/20 to-secondary/30",
    rotate: -5,
    x: -20,
    y: 0,
    delay: 0.3,
    row: 1,
    width: 160,
    left: "0%",
  },
  {
    icon: Shirt,
    name: "Camiseta Nike",
    price: "R$ 180",
    category: "Moda",
    gradient: "from-accent/30 via-purple-500/20 to-pink-500/20",
    rotate: 5,
    x: 20,
    y: 16,
    delay: 0.5,
    row: 1,
    width: 160,
    left: "40%",
  },
  // Row 2 — smaller, behind, tucked below
  {
    icon: Gamepad2,
    name: "PS5",
    price: "R$ 2.500",
    category: "Games",
    gradient: "from-blue-500/30 via-indigo-500/20 to-purple-500/15",
    rotate: 4,
    x: -10,
    y: 195,
    delay: 0.7,
    row: 2,
    width: 130,
    left: "8%",
  },
  {
    icon: Laptop,
    name: "Notebook Dell",
    price: "R$ 3.200",
    category: "Eletrônicos",
    gradient: "from-emerald-500/30 via-teal-500/20 to-primary/15",
    rotate: -3,
    x: 15,
    y: 205,
    delay: 0.9,
    row: 2,
    width: 130,
    left: "48%",
  },
];

const floatVariants = [
  { y: [0, -6, 0], duration: 3 },
  { y: [0, -5, 0], duration: 3.5 },
  { y: [0, -7, 0], duration: 4 },
  { y: [0, -4, 0], duration: 3.2 },
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
              radial-gradient(ellipse 45% 40% at 55% 45%, hsl(270 60% 50% / 0.06) 0%, transparent 50%),
              radial-gradient(ellipse 35% 25% at 40% 55%, hsl(220 70% 50% / 0.05) 0%, transparent 50%)
            `,
          }}
        />
        <div className="absolute bottom-0 h-[40%] w-full bg-gradient-to-t from-background via-background/90 to-transparent" />
      </div>

      {/* Product Preview Cards — second row overflows into text area */}
      <div className="relative z-10 flex items-start justify-center mb-[-60px]" style={{ paddingTop: "8%" }}>
        <div className="relative w-[300px] h-[340px]">
          {mockCards.map((card, i) => (
            <motion.div
              key={i}
              className="absolute glass-card rounded-2xl overflow-hidden"
              style={{
                width: card.width,
                left: card.left,
                top: card.y,
                zIndex: card.row === 1 ? 2 : 1,
                opacity: card.row === 2 ? 0.85 : 1,
              }}
              initial={{ opacity: 0, x: i % 2 === 0 ? -60 : 60, y: card.y + 30, rotate: card.rotate * 2 }}
              animate={{ opacity: card.row === 2 ? 0.85 : 1, x: card.x, y: card.y, rotate: card.rotate }}
              transition={{ delay: card.delay, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {/* Floating animation wrapper */}
              <motion.div
                animate={{ y: floatVariants[i].y }}
                transition={{
                  duration: floatVariants[i].duration,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: card.delay + 0.7,
                }}
              >
                {/* Gradient "photo" area */}
                <div
                  className={`bg-gradient-to-br ${card.gradient} flex items-center justify-center`}
                  style={{ height: card.row === 1 ? 120 : 80 }}
                >
                  <card.icon className="text-foreground/60" size={card.row === 1 ? 40 : 28} strokeWidth={1.5} />
                </div>
                {/* Card info */}
                <div className="p-3 space-y-1.5">
                  <p className="text-foreground text-sm font-semibold leading-tight">{card.name}</p>
                  <p className="text-primary text-xs font-bold">{card.price}</p>
                  <span className="inline-block px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-medium">
                    {card.category}
                  </span>
                </div>
              </motion.div>
            </motion.div>
          ))}

          {/* Swap icon */}
          <motion.div
            className="absolute z-10 flex items-center justify-center"
            style={{ left: "42%", top: "38%" }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.5, type: "spring", stiffness: 200 }}
          >
            <div className="w-11 h-11 rounded-full bg-background/90 border border-primary/30 flex items-center justify-center shadow-[0_0_20px_hsl(184_100%_50%/0.25)]">
              <motion.div
                animate={{ rotate: [0, 0, 180, 180, 360, 360], scale: [1, 1.15, 1.15, 1, 1, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
              >
                <ArrowLeftRight className="text-primary" size={18} />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col w-full px-6 pb-10">
        <motion.div
          initial="hidden"
          animate="visible"
          className="mb-8 space-y-5"
        >
          {/* Badge */}
          <motion.div custom={0} variants={fadeUp}>
            <div className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mr-2 animate-pulse" />
              <span className="text-primary text-[11px] font-semibold tracking-widest uppercase">
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

          {/* Description */}
          <motion.p
            custom={2}
            variants={fadeUp}
            className="text-muted-foreground text-[17px] font-light leading-relaxed max-w-xs"
          >
            Troque o que tá parado por algo que você quer. Dê match, negocie e faça trocas de forma segura.
          </motion.p>
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-3.5"
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
