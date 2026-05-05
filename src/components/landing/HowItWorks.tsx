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
    <section className="relative px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center text-3xl font-extrabold tracking-tight text-foreground md:text-4xl"
        >
          Como <span className="gradient-text">funciona</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto mt-3 max-w-md text-center text-sm text-muted-foreground"
        >
          Três passos simples pra você começar a trocar hoje.
        </motion.p>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              whileHover={{ y: -4 }}
              className="glass-card rounded-3xl border border-foreground/5 p-6"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
                <step.icon className="h-6 w-6" strokeWidth={2} />
              </div>
              <div className="mb-1 text-xs font-medium uppercase tracking-widest text-primary/70">
                Passo {i + 1}
              </div>
              <h3 className="text-xl font-bold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
