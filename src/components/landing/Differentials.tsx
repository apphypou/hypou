import { motion } from "framer-motion";
import { Sparkles, ShieldCheck, MessageCircle, Star } from "lucide-react";

const items = [
  {
    icon: Sparkles,
    title: "100% gratuito",
    desc: "Sem mensalidade, sem comissão. Trocar sempre será de graça.",
  },
  {
    icon: ShieldCheck,
    title: "IA valida o preço",
    desc: "Nosso modelo confere se o valor declarado bate com o mercado.",
  },
  {
    icon: MessageCircle,
    title: "Chat seguro",
    desc: "Converse só depois do match. Bloqueio e denúncia a um toque.",
  },
  {
    icon: Star,
    title: "Avaliações reais",
    desc: "Depois da troca, ambos avaliam. Reputação que importa.",
  },
];

const Differentials = () => {
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
          Feito pra <span className="gradient-text">trocas reais</span>
        </motion.h2>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {items.map((it, i) => (
            <motion.div
              key={it.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              className="glass-card flex gap-4 rounded-2xl border border-foreground/5 p-5"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                <it.icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <div>
                <h3 className="font-bold text-foreground">{it.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{it.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Differentials;
