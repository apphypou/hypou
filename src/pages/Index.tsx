import { ArrowRight, Repeat } from "lucide-react";
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

const floatingItems = [
  { emoji: "📱", x: "12%", y: "8%", size: 56, delay: 0, duration: 5, rotate: 6 },
  { emoji: "🎧", x: "72%", y: "5%", size: 48, delay: 0.8, duration: 6, rotate: -5 },
  { emoji: "👟", x: "55%", y: "22%", size: 52, delay: 1.2, duration: 4.5, rotate: 8 },
  { emoji: "🎮", x: "20%", y: "28%", size: 60, delay: 0.4, duration: 5.5, rotate: -4 },
  { emoji: "👜", x: "82%", y: "30%", size: 44, delay: 1.6, duration: 6.5, rotate: 5 },
  { emoji: "📷", x: "42%", y: "12%", size: 50, delay: 0.6, duration: 5, rotate: -7 },
  { emoji: "🎸", x: "8%", y: "42%", size: 46, delay: 1.0, duration: 5.8, rotate: 4 },
  { emoji: "⚽", x: "68%", y: "42%", size: 42, delay: 1.4, duration: 4.8, rotate: -6 },
];

const swapIcons = [
  { x: "36%", y: "18%", delay: 0.3, duration: 7 },
  { x: "62%", y: "36%", delay: 1.0, duration: 6 },
  { x: "25%", y: "48%", delay: 1.8, duration: 5.5 },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="dark relative min-h-screen flex flex-col justify-between overflow-hidden bg-[hsl(0,0%,11%)]">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 60% 50% at 50% 20%, hsl(184 100% 50% / 0.15) 0%, transparent 70%),
              radial-gradient(ellipse 40% 30% at 25% 35%, hsl(184 85% 42% / 0.08) 0%, transparent 60%),
              radial-gradient(ellipse 35% 25% at 75% 15%, hsl(174 60% 40% / 0.06) 0%, transparent 50%)
            `,
          }}
        />
        {/* Bottom fade to solid */}
        <div className="absolute bottom-0 h-[45%] w-full bg-gradient-to-t from-[hsl(0,0%,11%)] via-[hsl(0,0%,11%)]/90 to-transparent" />
      </div>

      {/* Floating Category Icons */}
      <div className="absolute inset-0 z-[1]">
        {floatingItems.map((item, i) => (
          <motion.div
            key={i}
            className="absolute flex items-center justify-center rounded-2xl bg-white/[0.06] backdrop-blur-sm border border-white/[0.08]"
            style={{
              left: item.x,
              top: item.y,
              width: item.size,
              height: item.size,
              fontSize: item.size * 0.45,
            }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: [0, 1, 1, 1],
              scale: 1,
              y: [0, -12, 0],
              rotate: [0, item.rotate, 0],
            }}
            transition={{
              opacity: { delay: item.delay + 0.3, duration: 0.6 },
              scale: { delay: item.delay + 0.3, duration: 0.4 },
              y: { delay: item.delay + 0.8, duration: item.duration, repeat: Infinity, ease: "easeInOut" },
              rotate: { delay: item.delay + 0.8, duration: item.duration, repeat: Infinity, ease: "easeInOut" },
            }}
          >
            {item.emoji}
          </motion.div>
        ))}

        {/* Swap/Repeat Icons */}
        {swapIcons.map((icon, i) => (
          <motion.div
            key={`swap-${i}`}
            className="absolute text-primary/20"
            style={{ left: icon.x, top: icon.y }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0.15, 0.35, 0.15],
              rotate: [0, 180, 360],
            }}
            transition={{
              delay: icon.delay + 1,
              duration: icon.duration,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Repeat size={20} />
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col w-full px-6 pb-10 mt-auto">
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
