
import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowRight, Flame, Copy, Check, Share2, Sparkles, Gamepad2, Headphones, Watch, Camera, Bike } from "lucide-react";
import HypouLogo from "@/components/HypouLogo";
import NeonButton from "@/components/NeonButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// ── CONFIG ──────────────────────────────────────────────────────────
const LAUNCH_DATE = new Date();
LAUNCH_DATE.setDate(LAUNCH_DATE.getDate() + 30);

// ── PARTICLES ───────────────────────────────────────────────────────
const Particles = () => {
  const dots = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 2 + Math.random() * 4,
        duration: 12 + Math.random() * 18,
        delay: Math.random() * 8,
        opacity: 0.08 + Math.random() * 0.18,
      })),
    []
  );

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {dots.map((d) => (
        <div
          key={d.id}
          className="absolute rounded-full bg-primary"
          style={{
            left: `${d.x}%`,
            top: `${d.y}%`,
            width: d.size,
            height: d.size,
            opacity: d.opacity,
            animation: `floatParticle ${d.duration}s ease-in-out ${d.delay}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
};

// ── COUNTDOWN ───────────────────────────────────────────────────────
const useCountdown = (target: Date) => {
  const calc = () => {
    const diff = Math.max(0, target.getTime() - Date.now());
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  };
  const [t, setT] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setT(calc), 1000);
    return () => clearInterval(id);
  }, []);
  return t;
};

const CountdownBlock = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center gap-1">
    <div className="glass-card rounded-2xl w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center border border-primary/20">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="text-2xl sm:text-3xl font-extrabold text-primary font-display"
        >
          {String(value).padStart(2, "0")}
        </motion.span>
      </AnimatePresence>
    </div>
    <span className="text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground font-semibold">
      {label}
    </span>
  </div>
);

// ── SOCIAL COUNTER ──────────────────────────────────────────────────
const useFakeCounter = (base: number) => {
  const [count, setCount] = useState(base);
  useEffect(() => {
    const id = setInterval(() => {
      setCount((c) => c + Math.floor(Math.random() * 3));
    }, 4000 + Math.random() * 6000);
    return () => clearInterval(id);
  }, []);
  return count;
};

// ── PREVIEW LEAK CARDS ──────────────────────────────────────────────
const leakCards = [
  { icon: Gamepad2, label: "Console", gradient: "from-purple-500/30 to-indigo-500/30" },
  { icon: Headphones, label: "Fone BT", gradient: "from-cyan-500/30 to-blue-500/30" },
  { icon: Watch, label: "Smartwatch", gradient: "from-emerald-500/30 to-teal-500/30" },
];

// ── TYPING EFFECT ───────────────────────────────────────────────────
const useTyping = (text: string, speed = 60) => {
  const [displayed, setDisplayed] = useState("");
  const idx = useRef(0);
  useEffect(() => {
    const id = setInterval(() => {
      idx.current++;
      setDisplayed(text.slice(0, idx.current));
      if (idx.current >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return displayed;
};

// ── MAIN PAGE ───────────────────────────────────────────────────────
const ListaEspera = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [position, setPosition] = useState(0);
  const [referralCode, setReferralCode] = useState("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const countdown = useCountdown(LAUNCH_DATE);
  const socialCount = useFakeCounter(1247);
  const tagline = useTyping("A nova forma de trocar", 70);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast({ title: "Email inválido", description: "Insira um email válido.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Get next position
      const { data: posData } = await supabase.rpc("get_waitlist_position");
      const nextPos = (posData as number) ?? 1;

      const { data, error } = await supabase
        .from("waitlist" as any)
        .insert({ email, position: nextPos } as any)
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          // Already registered - fetch existing
          const { data: existing } = await supabase
            .from("waitlist" as any)
            .select("position, referral_code")
            .eq("email", email)
            .single();
          if (existing) {
            setPosition((existing as any).position);
            setReferralCode((existing as any).referral_code);
            setRegistered(true);
          }
          toast({ title: "Você já está na lista! 🎉", description: "Mostrando sua posição." });
        } else {
          throw error;
        }
      } else {
        setPosition((data as any).position);
        setReferralCode((data as any).referral_code);
        setRegistered(true);
        toast({ title: "Você está dentro! 🚀", description: `Posição #${nextPos} garantida.` });
      }
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const shareUrl = `${window.location.origin}/lista-espera?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Hypou — Lista de Espera",
        text: "Garanta sua vaga na nova forma de trocar!",
        url: shareUrl,
      });
    } else {
      handleCopy();
    }
  };

  return (
    <div className="relative min-h-[100dvh] bg-white overflow-hidden flex flex-col items-center justify-center">
      <Particles />

      {/* Mesh gradient bg */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-30%] left-[-20%] w-[80%] h-[80%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-15%] w-[60%] h-[60%] rounded-full bg-primary/8 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg mx-auto px-6 py-12 flex flex-col items-center gap-8">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5"
        >
          <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
          <span className="text-xs font-semibold text-primary tracking-wide">Algo grande está chegando</span>
        </motion.div>

        {/* Logo breathing */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 150 }}
          className="relative"
        >
          <div className="animate-pulse-slow">
            <HypouLogo size="lg" className="text-5xl sm:text-6xl" />
          </div>
          {/* Glow behind logo */}
          <div className="absolute inset-0 -z-10 blur-3xl bg-primary/20 rounded-full scale-150" />
        </motion.div>

        {/* Tagline with typing */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-lg sm:text-xl text-muted-foreground font-medium h-7"
        >
          {tagline}
          <span className="animate-pulse text-primary">|</span>
        </motion.p>

        {/* Countdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="flex items-center gap-3 sm:gap-4"
        >
          <CountdownBlock value={countdown.days} label="dias" />
          <span className="text-2xl text-primary/40 font-bold mt-[-20px]">:</span>
          <CountdownBlock value={countdown.hours} label="hrs" />
          <span className="text-2xl text-primary/40 font-bold mt-[-20px]">:</span>
          <CountdownBlock value={countdown.minutes} label="min" />
          <span className="text-2xl text-primary/40 font-bold mt-[-20px]">:</span>
          <CountdownBlock value={countdown.seconds} label="seg" />
        </motion.div>

        {/* Form / Confirmation */}
        <AnimatePresence mode="wait">
          {!registered ? (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 1.2 }}
              onSubmit={handleSubmit}
              className="w-full flex flex-col gap-4"
            >
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu melhor email"
                  className="w-full h-14 pl-12 pr-4 rounded-2xl bg-card/50 border border-border/50 text-foreground placeholder:text-muted-foreground font-medium focus:outline-none focus:border-primary/50 focus:shadow-[0_0_20px_hsl(var(--primary)/0.15)] transition-all duration-300"
                />
              </div>
              <NeonButton type="submit" icon={ArrowRight} disabled={loading}>
                {loading ? "Entrando..." : "Garantir minha vaga"}
              </NeonButton>
            </motion.form>
          ) : (
            <motion.div
              key="confirmation"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full flex flex-col items-center gap-5"
            >
              <div className="glass-card rounded-3xl p-6 w-full text-center border border-primary/20">
                <p className="text-muted-foreground text-sm mb-1">Sua posição na fila</p>
                <motion.p
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="text-5xl font-extrabold text-primary text-glow"
                >
                  #{position}
                </motion.p>
                <p className="text-xs text-muted-foreground mt-2">Compartilhe para subir na fila!</p>
              </div>

              <div className="w-full flex gap-3">
                <button
                  onClick={handleCopy}
                  className="flex-1 h-12 rounded-xl bg-card/50 border border-border/50 flex items-center justify-center gap-2 text-sm font-semibold text-foreground hover:border-primary/30 transition-all"
                >
                  {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copiado!" : "Copiar link"}
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:bg-primary/20 transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  Compartilhar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Social counter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="flex items-center gap-2 text-muted-foreground"
        >
          <Flame className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-semibold">
            <span className="text-foreground">{socialCount.toLocaleString("pt-BR")}</span> pessoas na fila
          </span>
        </motion.div>

        {/* Leak preview cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8 }}
          className="flex items-center gap-3 w-full justify-center"
        >
          {leakCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2 + i * 0.15 }}
              className="relative w-24 h-32 sm:w-28 sm:h-36 rounded-2xl overflow-hidden border border-border/30"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} backdrop-blur-xl`} />
              <div className="absolute inset-0 backdrop-blur-xl bg-background/40 flex flex-col items-center justify-center gap-2">
                <card.icon className="w-6 h-6 text-primary/60" />
                <span className="text-[10px] font-semibold text-muted-foreground">{card.label}</span>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold text-primary/40 tracking-widest uppercase">Em breve</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
          className="text-sm text-muted-foreground font-medium tracking-wide"
        >
          Troque. Economize. Conquiste.
        </motion.p>
      </div>

      {/* Shimmer + particle CSS */}
      <style>{`
        @keyframes floatParticle {
          0% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-30px) translateX(15px); }
          100% { transform: translateY(5px) translateX(-10px); }
        }
        .animate-pulse-slow {
          animation: pulseSlow 4s ease-in-out infinite;
        }
        @keyframes pulseSlow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
      `}</style>
    </div>
  );
};

export default ListaEspera;
