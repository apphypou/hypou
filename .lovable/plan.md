

## Plano: Toggle Switch SVG com arraste (like/dislike)

O usuário quer substituir os dois botões separados por um **único componente toggle switch** — um SVG com forma de osso/cápsula que tem um knob arrastável. Arrasta para a esquerda = dislike (vermelho com X), arrasta para a direita = like (verde com check).

### O que muda

**Componente novo:** `src/components/SwipeToggle.tsx`
- SVG único (viewBox `0 0 180 100`) com a forma de osso (`path` com curvas Bézier e arcos)
- Dois fundos sobrepostos: vermelho (gradiente `#E75545`→`#C53A2A`) e verde (gradiente `#76E58F`→`#4BCC6B`) com opacidade controlada pelo progresso do arraste
- Knob branco circular (r=34) que se move horizontalmente (0 a 80 unidades SVG)
- Ícone X (vermelho) e ícone Check (verde) dentro do knob, com opacidade inversa baseada na posição
- Arraste via `onPointerDown/Move/Up` com `touch-action: none`
- Ao soltar: se passou da metade → dispara like e anima snap para direita; senão → dispara dislike e anima snap para esquerda
- Após o snap, reseta automaticamente para a posição neutra (esquerda/vermelho) para o próximo card
- Props: `onSwipe: (direction: "like" | "dislike") => void`, `disabled?: boolean`

**Integração com o arraste do card (animação reativa):**
- O componente também aceita `dragProgress` (o `dragDirectionValue` existente) para reagir ao arraste do card
- Quando o card é arrastado para a direita, o knob se move proporcionalmente para a direita e o fundo verde aparece
- Quando arrastado para a esquerda, o knob fica fixo na esquerda e o fundo permanece vermelho
- Isso mantém o feedback visual "competitivo" existente

**Arquivo `src/pages/Explorar.tsx`:**
- Remover as motion values dos botões individuais (likeButtonScale, likeButtonY, etc. — linhas 68-90)
- Remover o bloco de botões inteiro (linhas 371-442)
- Substituir por `<SwipeToggle onSwipe={handleSwipeComplete} dragProgress={dragDirectionValue} />`
- Remover imports não usados: `X`, `Heart` do lucide-react
- Manter `containerRotate` se quiser inclinar o toggle com o arraste, ou remover se preferir fixo

### Comportamento do toggle

1. **Estado neutro:** Knob na esquerda, fundo vermelho, ícone X visível
2. **Arrastando para direita:** Knob se move, fundo verde aparece gradualmente, ícone Check aparece, X desaparece
3. **Soltar após metade:** Snap para direita → dispara `onSwipe("like")` → reseta para estado neutro
4. **Soltar antes da metade:** Snap para esquerda → dispara `onSwipe("dislike")` → reseta para estado neutro
5. **Toque rápido (tap):** Alterna para o lado oposto, dispara ação correspondente, reseta

### Detalhes técnicos

- Filtros SVG para sombras (`feDropShadow`) no fundo e no knob
- Transição CSS `cubic-bezier(0.4, 0, 0.2, 1)` no snap (removida durante arraste para seguir o dedo)
- Dimensões: `width="180" height="100"` no SVG renderizado

