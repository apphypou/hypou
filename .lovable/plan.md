

# Critical UI/UX Review: Tela de Propostas de Troca

## 1. Hierarquia Visual Quebrada

O header "SUAS TROCAS" + "Propostas de Troca" compete visualmente com "INTERESSES RECEBIDOS". São três níveis de texto antes do conteúdo começar, ocupando espaço vertical precioso em mobile. O subtítulo "SUAS TROCAS" em ciano com tracking exagerado (0.2em) é decorativo e não funcional — o usuário já sabe onde está porque clicou na tab.

**Recomendação:** Eliminar o subtítulo "SUAS TROCAS" ou fundir com o título. Um único título basta.

---

## 2. Degradê no Card: Corte Abrupto

O gradiente `from-background/90 via-transparent to-transparent` sobre a imagem cria uma transição artificial que "corta" a foto. No modo claro (screenshot), o branco invade a imagem de forma brusca. Não há suavidade — parece um card mal recortado.

**Recomendação:** Reduzir a intensidade do gradiente para `from-background/60` e usar uma transição mais longa (aumentar a altura do overlay ou usar um `via` mais suave).

---

## 3. Contraste de Cores Problemático

- O preço em **ciano sobre fundo branco** (`text-primary`) tem contraste insuficiente. Ciano claro (#00e5ff range) sobre branco falha WCAG AA para texto normal. É bonito no dark mode, ilegível no light mode.
- "Valor de mercado" em `text-foreground/40` — 40% de opacidade sobre branco é praticamente invisível.
- A localização "São Paulo, SP" em `text-foreground/50` também está no limite.

**Recomendação:** No light mode, usar uma variante mais escura do primary para preços. Subir opacidades mínimas para `/60` em textos secundários.

---

## 4. Badge "ACEITA" / "Nova Proposta" — Sem Hierarquia de Status

Os badges são visualmente idênticos (mesmo estilo, mesma posição). "ACEITA" e "Nova Proposta" são estados completamente diferentes mas recebem o mesmo tratamento visual. O usuário não consegue escanear rapidamente quais propostas precisam de ação.

**Recomendação:** Diferenciar por cor: propostas pendentes com badge ciano/primary, aceitas com badge verde (success), recusadas com vermelho. Usar cores sólidas nos badges, não transparências que se perdem sobre imagens claras.

---

## 5. Tipografia do Card — Peso Excessivo

O nome do item ("iPhone 14 Pro Max") está em `font-bold text-xl`. O preço ao lado também está em `font-bold text-lg`. Dois elementos bold lado a lado competem entre si. Não há respiro tipográfico.

**Recomendação:** Reduzir o preço para `font-semibold text-base` ou mover para uma linha separada. Criar hierarquia clara: nome > preço > localização.

---

## 6. Área do Usuário (Avatar + Nome) — Subutilizada

A seção do owner no footer do card é genérica. O avatar com iniciais em `text-foreground/40` sobre `bg-card` no light mode é quase invisível. O ícone de chat (MessageSquare) no canto direito não tem affordance — parece decorativo, não clicável.

**Recomendação:** Dar mais destaque ao avatar (borda colorida ou shadow). O botão de chat precisa de um background mais visível ou um label "Conversar".

---

## 7. Espaçamento e Densidade

- `gap-6` entre cards é excessivo para mobile — desperdiça scroll.
- `p-5` interno do card + `px-5` do container = muito padding acumulado, reduzindo a área útil da imagem.
- A imagem tem apenas `h-48` — proporção achatada que não valoriza o produto.

**Recomendação:** Reduzir gap para `gap-4`, padding interno para `p-4`. Aumentar altura da imagem para `h-56` ou usar aspect-ratio 4:3.

---

## 8. Empty State Preguiçoso

O emoji "🤝" como ilustração de empty state é amador. Falta um CTA claro direcionando o usuário para o Explorar.

**Recomendação:** Adicionar um botão "Explorar itens" no empty state. Substituir emoji por ilustração ou ícone estilizado.

---

## 9. O Card Inteiro é Clicável mas Não Parece

O `cursor-pointer` existe mas não há feedback visual de tap/press. Em mobile não existe hover. O usuário não tem affordance de que pode clicar no card.

**Recomendação:** Adicionar `active:scale-[0.98]` e uma transição sutil no card para feedback tátil.

---

## Resumo de Prioridades

| Severidade | Problema | Impacto |
|-----------|---------|---------|
| Alta | Contraste do preço no light mode | Acessibilidade |
| Alta | Badges sem diferenciação de status | Usabilidade |
| Média | Degradê abrupto na imagem | Estética |
| Média | Hierarquia tipográfica competitiva | Legibilidade |
| Baixa | Espaçamentos excessivos | Densidade |
| Baixa | Empty state sem CTA | Engajamento |

