import { motion } from "framer-motion";
import { Search, Heart, Handshake } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Descubra",
    desc: "Explore objetos perto de você com swipe rápido e fluido.",
  },
  {
    icon: Heart,
    title: "Hypou",
    desc: "Curtiu? Proponha sua troca direto pelo app, sem dinheiro.",
  },
  {
    icon: Handshake,
    title: "Troque",
    desc: "Combinou? Conversem no chat seguro e fechem o negócio.",
  },
];

const HowItWorks = () => {
  return (
    <section className="relative px-5 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center text-xs font-medium uppercase tracking-[0.2em] text-primary/70"
        >
          Como funciona
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, delay: 0.05 }}
          className="mx-auto mt-3 max-w-2xl text-center text-3xl font-extrabold leading-tight tracking-tight text-foreground md:text-5xl"
        >
          Três passos. Zero dinheiro. <span className="gradient-text">Trocas reais.</span>
        </motion.h2>

        <div className="relative mt-16 grid gap-5 md:grid-cols-3">
          {/* connector line desktop */}
          <div
            className="pointer-events-none absolute left-[16%] right-[16%] top-12 hidden h-px md:block"
            style={{
              background:
                "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.4), transparent)",
            }}
          />
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              whileHover={{ y: -6 }}
              className="glass-card relative rounded-3xl border border-foreground/5 p-7 transition-shadow hover:shadow-[0_0_40px_-10px_hsl(var(--primary)/0.4)]"
            >
              <div className="absolute -top-3 left-7 rounded-full border border-primary/20 bg-background px-3 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-primary">
                0{i + 1}
              </div>
              <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
                <step.icon className="h-7 w-7" strokeWidth={2} />
              </div>
              <h3 className="text-2xl font-bold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
