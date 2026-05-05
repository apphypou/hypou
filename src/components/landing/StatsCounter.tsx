import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";

const stats = [
  { value: 12000, suffix: "+", label: "Trocas realizadas", isLarge: true },
  { value: 5800, suffix: "+", label: "Pessoas trocando", isLarge: true },
  { value: 4.8, suffix: "", label: "Nota na loja", decimals: 1 },
];

const Counter = ({ to, decimals = 0 }: { to: number; decimals?: number }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => v.toFixed(decimals));

  useEffect(() => {
    if (inView) {
      const controls = animate(mv, to, { duration: 1.8, ease: [0.25, 0.46, 0.45, 0.94] });
      return controls.stop;
    }
  }, [inView, to, mv]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
};

const LargeCounter = ({ to }: { to: number }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v).toLocaleString("pt-BR"));

  useEffect(() => {
    if (inView) {
      const controls = animate(mv, to, { duration: 2, ease: [0.16, 1, 0.3, 1] });
      return controls.stop;
    }
  }, [inView, to, mv]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
};

const StatsCounter = () => {
  return (
    <section className="relative overflow-hidden border-y border-foreground/5 bg-foreground/[0.02] px-5 py-16 sm:px-6 sm:py-24">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 50% 60% at 50% 50%, hsl(184 100% 50% / 0.10) 0%, transparent 70%)`,
          }}
        />
      </div>
      <div className="mx-auto max-w-6xl">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center text-xs font-medium uppercase tracking-[0.2em] text-primary/70"
        >
          Quem tá trocando
        </motion.p>
        <div className="grid gap-12 md:grid-cols-3 md:gap-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="text-center"
            >
              <div className="text-glow text-5xl font-extrabold tracking-tight text-primary sm:text-6xl md:text-7xl lg:text-[88px]">
                {s.isLarge ? <LargeCounter to={s.value} /> : <Counter to={s.value} decimals={s.decimals ?? 0} />}
                <span className="text-primary/80">{s.suffix}</span>
              </div>
              <p className="mt-3 text-sm font-medium text-muted-foreground md:text-base">
                {s.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsCounter;
