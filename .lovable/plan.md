## Objetivo
Substituir, no toggle de swipe abaixo do card em Explorar, os ícones genéricos (chevrons neutros + X/check no arraste) por uma linguagem visual própria do Hypou:

- Esquerda (Flopou / rejeitar): ícone **Repeat** (Lucide) — devolve o item pra pilha.
- Direita (Hypou / curtir): ícone **Handshake** (Lucide) — aperto de mão da marca.
- **Remover** os chevrons neutros do estado de repouso, deixando o knob limpo.

## Onde mexer
Arquivo único: `src/components/SwipeToggle.tsx`

1. Importar `Repeat` e `Handshake` de `lucide-react` (ou renderizar SVG inline pra continuar dentro do `<svg>` atual).
2. Remover o bloco de chevrons neutros (o `<g opacity={neutralOpacity * 0.5}>` com os dois `path` de seta).
3. Substituir o `<g opacity={leftProgress}>` (X vermelho) por um ícone `Repeat` em vermelho/`--danger`, mesmo tamanho visual (~24px dentro do knob de raio 38).
4. Substituir o `<g opacity={rightProgress}>` (check verde) por um ícone `Handshake` em verde/`--success`.
5. Centralizar os ícones no knob (translate para o centro 50,50) e manter as transições de opacidade já existentes.
6. Atualizar a cor do stroke do knob: como o estado neutro fica sem ícone, manter o anel ciano `hsl(var(--primary))` como única dica visual de "arraste pra qualquer lado".

## Detalhes técnicos
- Para usar ícones Lucide dentro de SVG, a forma mais simples é renderizar como overlay HTML absoluto sobre o `<svg>` em vez de tentar embutir. Plano: envolver o `<svg>` em `<div className="relative">` e posicionar dois `<Repeat />` e `<Handshake />` absolutos sobre o knob, controlando opacidade pelos mesmos `leftProgress`/`rightProgress` e `translateX(position)`.
- Mantém toda a lógica de drag, snap, haptics e callback `onSwipe` intactos — mudança é puramente visual.
- Tokens: usar `text-[hsl(var(--danger))]` e `text-[hsl(var(--success))]` (já existem no design system) em vez dos hex `#E75545` / `#4BCC6B`.

## Não muda
- Comportamento de arraste, thresholds (`MAX_DRAG`, `SNAP_THRESHOLD`).
- Halos radiais vermelho/verde de fundo.
- Testes em `src/test/components/SwipeToggle.test.tsx` (são de lógica pura, seguem válidos).

## Documentação
Atualizar `documentacao.md` registrando que a iconografia do SwipeToggle passou a usar Repeat (Flopou) e Handshake (Hypou), alinhada à voz da marca.
