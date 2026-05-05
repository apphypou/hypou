import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  { name: "Marina S.", text: "Troquei minha bike parada por um drone novo. Surreal." },
  { name: "Lucas P.", text: "Sem dinheiro, sem golpe. Só troca real entre pessoas." },
  { name: "Ana R.", text: "Em 3 dias fechei minha primeira troca. App fluido demais." },
];

const SocialProof = () => {
  return (
    <section className="relative px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mb-10 flex flex-col items-center gap-3 text-center"
        >
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} className="h-5 w-5 fill-primary text-primary" strokeWidth={0} />
            ))}
            <span className="ml-2 text-sm font-semibold text-foreground">4.8</span>
            <span className="text-sm text-muted-foreground">· 2.300+ avaliações</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
            Trocas que <span className="gradient-text">acontecem de verdade</span>
          </h2>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              className="glass-card rounded-2xl border border-foreground/5 p-6"
            >
              <div className="mb-3 flex">
                {[0, 1, 2, 3, 4].map((s) => (
                  <Star key={s} className="h-3.5 w-3.5 fill-primary text-primary" strokeWidth={0} />
                ))}
              </div>
              <blockquote className="text-sm leading-relaxed text-foreground/90">
                "{t.text}"
              </blockquote>
              <figcaption className="mt-4 text-xs font-medium text-muted-foreground">
                — {t.name}
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
