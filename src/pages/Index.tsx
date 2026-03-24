import { ArrowRight, ArrowLeftRight, Headphones, Shirt } from "lucide-react";
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
  },
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
              radial-gradient(ellipse 55% 45% at 50% 30%, hsl(184 100% 50% / 0.20) 0%, transparent 70%),
              radial-gradient(ellipse 35% 30% at 45% 28%, hsl(184 100% 60% / 0.12) 0%, transparent 50%),
              radial-gradient(ellipse 40% 35% at 60% 25%, hsl(270 60% 50% / 0.06) 0%, transparent 50%)
            `,
          }}
        />
        <div className="absolute bottom-0 h-[45%] w-full bg-gradient-to-t from-background via-background/90 to-transparent" />
      </div>

      {/* Product Preview Cards */}
      <div className="relative z-10 flex-1 flex items-start justify-center" style={{ paddingTop: "14%" }}>
        <div className="relative w-[300px] h-[320px]">
          {mockCards.map((card, i) => (
            <motion.div
              key={i}
              className="absolute glass-card rounded-2xl w-[160px] overflow-hidden"
              style={{
                left: i === 0 ? "0%" : "40%",
                top: card.y,
                zIndex: i === 0 ? 2 : 1,
              }}
              initial={{ opacity: 0, x: i === 0 ? -60 : 60, rotate: card.rotate * 2 }}
              animate={{ opacity: 1, x: card.x, rotate: card.rotate }}
              transition={{ delay: card.delay, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {/* Gradient "photo" area */}
              <div className={`h-[120px] bg-gradient-to-br ${card.gradient} flex items-center justify-center`}>
                <card.icon className="text-foreground/60" size={40} strokeWidth={1.5} />
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
          ))}

          {/* Swap icon */}
          <motion.div
            className="absolute z-10 flex items-center justify-center"
            style={{ left: "42%", top: "45%" }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.5, type: "spring", stiffness: 200 }}
          >
            <div className="w-11 h-11 rounded-full bg-background/90 border border-primary/30 flex items-center justify-center shadow-[0_0_20px_hsl(184_100%_50%/0.25)]">
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
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
