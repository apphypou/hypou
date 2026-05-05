import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";

const stats = [
  { value: 10000, suffix: "+", label: "Trocas realizadas" },
  { value: 5000, suffix: "+", label: "Usuários ativos" },
  { value: 4.8, suffix: "", label: "Nota média", decimals: 1 },
];

const Counter = ({ to, decimals = 0 }: { to: number; decimals?: number }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => v.toFixed(decimals));

  useEffect(() => {
    if (inView) {
      const controls = animate(mv, to, { duration: 1.6, ease: [0.25, 0.46, 0.45, 0.94] });
      return controls.stop;
    }
  }, [inView, to, mv]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
};

const formatLargeNumber = (v: number) => {
  if (v >= 1000) return `${Math.round(v / 1000)}k`;
  return v.toString();
};

const StatsCounter = () => {
  return (
    <section className="relative px-6 py-16">
      <div className="mx-auto grid max-w-4xl grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="glass-card rounded-2xl border border-foreground/5 p-5 text-center"
          >
            <div className="text-3xl font-extrabold text-primary md:text-4xl">
              {s.value >= 1000 ? (
                <>
                  {formatLargeNumber(s.value)}
                  {s.suffix}
                </>
              ) : (
                <>
                  <Counter to={s.value} decimals={s.decimals ?? 0} />
                  {s.suffix}
                </>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground md:text-sm">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default StatsCounter;
