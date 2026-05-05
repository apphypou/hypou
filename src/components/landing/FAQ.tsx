import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "O Hypou é mesmo gratuito?",
    a: "Sim. 100% grátis, sem mensalidade, sem comissão por troca, sem taxa escondida. Sempre será.",
  },
  {
    q: "Como funciona a validação de preço por IA?",
    a: "Quando você anuncia, nossa IA (Gemini 3) consulta o mercado em tempo real e avisa se o valor declarado está fora do esperado, garantindo trocas justas.",
  },
  {
    q: "Preciso pagar algo na hora da troca?",
    a: "Nunca. O Hypou é só objeto por objeto. Não envolvemos dinheiro nem intermediamos pagamento.",
  },
  {
    q: "É seguro conversar com outras pessoas no app?",
    a: "Sim. O chat só abre depois do match aceito. Você pode bloquear ou denunciar a um toque, e contas suspeitas são removidas.",
  },
  {
    q: "Em quais cidades o app funciona?",
    o: "Em qualquer lugar do Brasil. Mostramos primeiro os objetos mais próximos de você usando geolocalização.",
    a: "Em qualquer lugar do Brasil. Mostramos primeiro os objetos mais próximos de você usando geolocalização.",
  },
];

const FAQ = () => {
  return (
    <section className="relative px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center text-xs font-medium uppercase tracking-[0.2em] text-primary/70"
        >
          Perguntas frequentes
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, delay: 0.05 }}
          className="mt-3 text-center text-3xl font-extrabold leading-tight tracking-tight text-foreground md:text-5xl"
        >
          A gente <span className="gradient-text">responde</span>.
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="mt-10"
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((f, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="glass-card rounded-2xl border border-foreground/5 px-5"
              >
                <AccordionTrigger className="text-left text-base font-semibold text-foreground hover:no-underline hover:text-primary">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ;
