import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import NeonButton from "@/components/NeonButton";
import HypouLogo from "@/components/HypouLogo";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.12, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const orbits = [
  { size: 200, duration: 25, direction: 1, opacity: 0.15, particles: [0, 180] },
  { size: 300, duration: 35, direction: -1, opacity: 0.10, particles: [60, 200, 320] },
  { size: 400, duration: 45, direction: 1, opacity: 0.06, particles: [90, 270] },
];

const bgParticles = [
  { x: "10%", y: "8%", size: 3, delay: 0 },
  { x: "85%", y: "12%", size: 2, delay: 1.2 },
  { x: "70%", y: "5%", size: 4, delay: 0.5 },
  { x: "25%", y: "35%", size: 2, delay: 2.0 },
  { x: "90%", y: "28%", size: 3, delay: 0.8 },
  { x: "5%", y: "45%", size: 2, delay: 1.5 },
  { x: "50%", y: "3%", size: 3, delay: 0.3 },
  { x: "78%", y: "42%", size: 2, delay: 1.8 },
  { x: "35%", y: "48%", size: 3, delay: 2.5 },
  { x: "60%", y: "38%", size: 2, delay: 0.7 },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="dark relative min-h-screen flex flex-col justify-between overflow-hidden bg-background">
      {/* Intensified Mesh Gradient Background */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 50% 40% at 50% 25%, hsl(184 100% 50% / 0.28) 0%, transparent 70%),
              radial-gradient(ellipse 30% 25% at 50% 22%, hsl(184 100% 60% / 0.15) 0%, transparent 50%),
              radial-gradient(ellipse 60% 50% at 30% 30%, hsl(184 85% 42% / 0.08) 0%, transparent 60%),
              radial-gradient(ellipse 40% 35% at 70% 20%, hsl(174 60% 40% / 0.06) 0%, transparent 50%)
            `,
          }}
        />
        <div className="absolute bottom-0 h-[45%] w-full bg-gradient-to-t from-background via-background/90 to-transparent" />
      </div>

      {/* Background Particles */}
      <div className="absolute inset-0 z-[1]">
        {bgParticles.map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-primary"
            style={{ left: p.x, top: p.y, width: p.size, height: p.size }}
            animate={{ opacity: [0.08, 0.25, 0.08] }}
            transition={{ delay: p.delay, duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>

      {/* Orbital Composition */}
      <div className="absolute inset-0 z-[2] flex items-start justify-center" style={{ paddingTop: "12%" }}>
        <div className="relative" style={{ width: 400, height: 400 }}>
          {/* Central Logo */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <HypouLogo size="lg" className="text-glow" />
          </div>

          {/* Orbits */}
          {orbits.map((orbit, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: orbit.size,
                height: orbit.size,
                top: "50%",
                left: "50%",
                marginTop: -orbit.size / 2,
                marginLeft: -orbit.size / 2,
                border: `1px solid hsl(184 100% 50% / ${orbit.opacity})`,
              }}
              animate={{ rotate: 360 * orbit.direction }}
              transition={{ duration: orbit.duration, repeat: Infinity, ease: "linear" }}
            >
              {/* Orbital Particles */}
              {orbit.particles.map((angle, j) => {
                const rad = (angle * Math.PI) / 180;
                const r = orbit.size / 2;
                const px = r + r * Math.cos(rad);
                const py = r + r * Math.sin(rad);
                const particleSize = i === 0 ? 10 : i === 1 ? 8 : 6;
                return (
                  <motion.div
                    key={j}
                    className="absolute rounded-full bg-primary"
                    style={{
                      width: particleSize,
                      height: particleSize,
                      left: px - particleSize / 2,
                      top: py - particleSize / 2,
                      boxShadow: `0 0 ${particleSize + 4}px hsl(184 100% 50% / 0.6), 0 0 ${particleSize * 2}px hsl(184 100% 50% / 0.3)`,
                    }}
                    animate={{
                      rotate: -360 * orbit.direction,
                      scale: [1, 1.3, 1],
                    }}
                    transition={{
                      rotate: { duration: orbit.duration, repeat: Infinity, ease: "linear" },
                      scale: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: j * 0.5 },
                    }}
                  />
                );
              })}
            </motion.div>
          ))}
        </div>
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
