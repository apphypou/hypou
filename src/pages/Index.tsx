import { ArrowRight, Handshake } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import NeonButton from "@/components/NeonButton";
import ps5Image from "@/assets/ps5-hero.jpg";
import notebookImage from "@/assets/notebook-hero.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.12, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

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

      {/* Circular Product Images — like Match screen */}
      <div className="relative z-10 flex items-start justify-center" style={{ paddingTop: "18%" }}>
        <div className="relative flex justify-center items-center h-48 w-full">
          {/* Glow behind */}
          <div className="absolute w-48 h-48 bg-primary/20 rounded-full blur-[60px]" />

          {/* Left circle — PS5 */}
          <motion.div
            className="relative z-10"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="w-36 h-36 rounded-full border-[5px] border-background overflow-hidden shadow-2xl ring-2 ring-primary/40 translate-x-4">
                <img src={ps5Image} alt="PS5" className="w-full h-full object-cover" width={512} height={512} />
              </div>
            </motion.div>
          </motion.div>

          {/* Center Handshake Icon */}
          <motion.div
            className="absolute z-30"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.5, type: "spring", stiffness: 200 }}
          >
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="bg-primary text-primary-foreground rounded-full p-2.5 border-[5px] border-background shadow-lg shadow-primary/30">
                <Handshake className="h-6 w-6" />
              </div>
            </motion.div>
          </motion.div>

          {/* Right circle — Notebook */}
          <motion.div
            className="relative z-20"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            >
              <div className="w-36 h-36 rounded-full border-[5px] border-background overflow-hidden shadow-2xl ring-2 ring-primary/40 -translate-x-4">
                <img src={notebookImage} alt="Notebook" className="w-full h-full object-cover" width={512} height={512} />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-20 flex flex-col w-full px-6 pb-10">
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
