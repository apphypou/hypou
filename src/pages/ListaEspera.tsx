
import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowRight, Flame, Copy, Check, Share2, MessageCircle } from "lucide-react";
import HypouLogo from "@/components/HypouLogo";
import logoHypou from "@/assets/logo-hypou.png";
import NeonButton from "@/components/NeonButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

// ── CONFIG ──────────────────────────────────────────────────────────
const LAUNCH_DATE = new Date();
LAUNCH_DATE.setDate(LAUNCH_DATE.getDate() + 30);

// ── PARTICLES ───────────────────────────────────────────────────────
const Particles = () => {
  const dots = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 2 + Math.random() * 3,
        duration: 14 + Math.random() * 20,
        delay: Math.random() * 8,
        opacity: 0.03 + Math.random() * 0.06,
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
    <div className="rounded-xl sm:rounded-2xl w-14 h-14 sm:w-20 sm:h-20 flex items-center justify-center bg-white/5 backdrop-blur-sm border border-white/10 shadow-sm">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: -16, opacity: 0, filter: "blur(4px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: 16, opacity: 0, filter: "blur(4px)" }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="text-xl sm:text-3xl font-extrabold text-primary font-display tabular-nums"
        >
          {String(value).padStart(2, "0")}
        </motion.span>
      </AnimatePresence>
    </div>
    <span className="text-[9px] sm:text-xs uppercase tracking-wider sm:tracking-widest text-muted-foreground font-semibold">
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

// ── ROTATING WORDS ──────────────────────────────────────────────────
const rotatingWords = ["um PS5.", "um iPhone.", "uma bike.", "um imóvel."];

const useRotatingWord = () => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % rotatingWords.length), 2800);
    return () => clearInterval(id);
  }, []);
  return rotatingWords[idx];
};

// ── THANK YOU SCREEN ────────────────────────────────────────────────
const ThankYouScreen = ({
  position,
  referralCode,
}: {
  position: number;
  referralCode: string;
}) => {
  const { data: whatsappUrl } = useQuery({
    queryKey: ["site-settings", "whatsapp_group_url"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings" as any)
        .select("value")
        .eq("key", "whatsapp_group_url")
        .single();
      return (data as any)?.value as string || "https://chat.whatsapp.com/CQBuRByILKp5M0RQLYnTet";
    },
    staleTime: 1000 * 60 * 5,
  });
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/lista-espera?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Hypou — Algo grande está chegando",
        text: "Entra na fila antes que acabe. Você não vai querer ficar de fora.",
        url: shareUrl,
      });
    } else {
      handleCopy();
    }
  };

  return (
    <motion.div
      key="thank-you"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full flex flex-col items-center gap-5 max-w-md mx-auto"
    >
      {/* Confetti emoji */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
        className="text-6xl"
      >
        🎉
      </motion.div>

      {/* Thank you message */}
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-2">
          Você está dentro!
        </h2>
        <p className="text-sm text-muted-foreground">
          Obrigado por se cadastrar. Você é o <span className="text-primary font-bold">#{position}</span> na fila.
        </p>
      </div>

      {/* WhatsApp CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full rounded-2xl border border-green-500/20 bg-green-500/5 p-5 text-center"
      >
        <MessageCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-foreground mb-1">
          Entre no grupo de lançamento
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Receba novidades em primeira mão, participe de sorteios exclusivos e conecte-se com a comunidade.
        </p>
        <a
          href={whatsappUrl || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-green-500 text-white text-sm font-bold hover:bg-green-600 transition-all shadow-lg shadow-green-500/20"
        >
          <MessageCircle className="w-5 h-5" />
          Entrar no grupo do WhatsApp
        </a>
      </motion.div>

      {/* Referral section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full"
      >
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
            Suba na fila — compartilhe seu link
          </p>
          <p className="text-[10px] text-muted-foreground mb-3">
            Cada amigo que entra pelo seu link = <span className="text-primary font-bold">você sobe na fila</span>
          </p>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10 text-xs text-muted-foreground font-mono overflow-hidden">
            <span className="truncate flex-1">{shareUrl}</span>
          </div>
        </div>

        <div className="flex gap-3 mt-3">
          <button
            onClick={handleCopy}
            className="flex-1 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground hover:border-primary/40 transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copiado!" : "Copiar"}
          </button>
          <button
            onClick={handleShare}
            className="flex-1 h-12 rounded-xl bg-primary text-white flex items-center justify-center gap-2 text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            <Share2 className="w-4 h-4" />
            Compartilhar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ── MAIN PAGE ───────────────────────────────────────────────────────
const ListaEspera = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [position, setPosition] = useState(0);
  const [referralCode, setReferralCode] = useState("");
  const { toast } = useToast();

  const countdown = useCountdown(LAUNCH_DATE);
  const socialCount = useFakeCounter(1247);
  const rotatingWord = useRotatingWord();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast({ title: "Email inválido", description: "Insira um email válido.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: posData } = await supabase.rpc("get_waitlist_position");
      const nextPos = (posData as number) ?? 1;

      const { data, error } = await supabase
        .from("waitlist" as any)
        .insert({ email, position: nextPos } as any)
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
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

  return (
    <div className="dark relative min-h-[100dvh] bg-background overflow-hidden flex flex-col">
      <Particles />

      {/* Mesh gradient bg */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-30%] left-[-20%] w-[80%] h-[80%] rounded-full bg-primary/[0.03] blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-15%] w-[60%] h-[60%] rounded-full bg-primary/[0.05] blur-[100px]" />
        <div className="absolute top-[30%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-500/[0.02] blur-[80px]" />
      </div>

      <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 gap-6 sm:gap-8">

        <AnimatePresence mode="wait">
          {!registered ? (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -30 }}
              className="flex flex-col items-center gap-6 sm:gap-8 max-w-md w-full"
            >
              {/* Logo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 150 }}
                className="relative flex flex-col items-center"
              >
                <img src={logoHypou} alt="Hypou" className="h-16 sm:h-20 w-auto object-contain" />
                <div className="absolute inset-0 -z-10 blur-3xl bg-primary/10 rounded-full scale-150" />
              </motion.div>

              {/* Dynamic headline */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-center"
              >
                <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
                  Troque o que não usa por{" "}
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={rotatingWord}
                      initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                      transition={{ duration: 0.4 }}
                      className="text-primary inline-block"
                    >
                      {rotatingWord}
                    </motion.span>
                  </AnimatePresence>
                </h1>
                <p className="text-sm text-muted-foreground mt-2">
                  O app que conecta pessoas para trocar objetos. Sem pagar nada. Só chega primeiro quem entrar agora.
                </p>
              </motion.div>

              {/* Countdown */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 }}
                className="w-full"
              >
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-3 text-center">
                  Lançamento oficial em
                </p>
                <div className="flex items-center gap-1.5 sm:gap-3 justify-center">
                  <CountdownBlock value={countdown.days} label="dias" />
                  <span className="text-base sm:text-xl text-primary/40 font-bold mt-[-16px] sm:mt-[-20px]">:</span>
                  <CountdownBlock value={countdown.hours} label="hrs" />
                  <span className="text-base sm:text-xl text-primary/40 font-bold mt-[-16px] sm:mt-[-20px]">:</span>
                  <CountdownBlock value={countdown.minutes} label="min" />
                  <span className="text-base sm:text-xl text-primary/40 font-bold mt-[-16px] sm:mt-[-20px]">:</span>
                  <CountdownBlock value={countdown.seconds} label="seg" />
                </div>
              </motion.div>

              {/* Form */}
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6 }}
                onSubmit={handleSubmit}
                className="w-full flex flex-col gap-3"
              >
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Seu melhor email"
                    className="w-full h-12 sm:h-14 pl-12 pr-4 rounded-2xl bg-white/5 border border-white/10 text-sm sm:text-base text-foreground placeholder:text-muted-foreground font-medium focus:outline-none focus:border-primary focus:shadow-[0_0_20px_hsl(var(--primary)/0.12)] transition-all duration-300"
                  />
                </div>
                <NeonButton type="submit" icon={ArrowRight} disabled={loading}>
                  {loading ? "Entrando..." : "Quero entrar primeiro →"}
                </NeonButton>
                <p className="text-[10px] text-muted-foreground text-center">
                  5 segundos pra cadastrar. Zero spam. Cancele quando quiser.
                </p>
              </motion.form>

              {/* Social counter */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8 }}
                className="flex items-center gap-2"
              >
                <div className="flex -space-x-2">
                  {[
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face",
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
                    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=80&h=80&fit=crop&crop=face",
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=face",
                  ].map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt=""
                      className="w-7 h-7 rounded-full border-2 border-background object-cover"
                      style={{ zIndex: 4 - i }}
                    />
                  ))}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-foreground">
                    {socialCount.toLocaleString("pt-BR")}+
                  </span>
                  <span className="text-[10px] text-muted-foreground">já garantiram vaga</span>
                </div>
                <Flame className="w-4 h-4 text-orange-400 ml-1 animate-pulse" />
              </motion.div>
            </motion.div>
          ) : (
            <ThankYouScreen position={position} referralCode={referralCode} />
          )}
        </AnimatePresence>

      </div>

      {/* CSS */}
      <style>{`
        @keyframes floatParticle {
          0% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-30px) translateX(15px); }
          100% { transform: translateY(5px) translateX(-10px); }
        }
      `}</style>
    </div>
  );
};

export default ListaEspera;
