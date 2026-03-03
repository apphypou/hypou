

## Plano: Toggle neutro no centro com animação bidirecional

### Problema atual
O knob começa fixo na esquerda (posição 0 = dislike/vermelho). O usuário quer que ele comece **no centro** (neutro), sem cor definida, e que a animação de cor/ícone **apareça gradualmente a partir do centro** conforme o arraste.

### Mudanças em `src/components/SwipeToggle.tsx`

**1. Posição neutra no centro**
- `position` começa em `MAX_DRAG / 2` (40) em vez de `0`
- O knob fica centralizado na cápsula no repouso

**2. Fundo neutro (cinza/transparente) no centro**
- Fundo base muda de vermelho fixo para um **cinza neutro** (ex: `#D0D0D0` → `#B8B8B8`)
- Vermelho e verde são ambos camadas sobrepostas com opacidade baseada na direção:
  - Arrastando para a **direita** do centro → fundo verde aparece (opacidade proporcional)
  - Arrastando para a **esquerda** do centro → fundo vermelho aparece (opacidade proporcional)
  - No centro → ambos com opacidade 0, só o cinza neutro visível

**3. Ícones com fade bidirecional**
- No centro: ambos X e Check com opacidade 0 (ou baixíssima ~0.15 para hint sutil)
- Arrastar para esquerda: X aparece gradualmente, Check desaparece
- Arrastar para direita: Check aparece gradualmente, X desaparece

**4. Lógica de progresso bidirecional**
- `progress` passa de `0..1` linear para um cálculo bidirecional:
  - `rightProgress = Math.max(0, (position - CENTER) / (MAX_DRAG - CENTER))` → 0..1 para verde/check
  - `leftProgress = Math.max(0, (CENTER - position) / CENTER)` → 0..1 para vermelho/X
- CENTER = MAX_DRAG / 2 = 40

**5. Arraste e snap**
- `handlePointerDown`: base de arraste é a posição atual (centro)
- `handlePointerUp`: 
  - Se posição > 60 (75% do caminho) → snap right → like → reset ao centro
  - Se posição < 20 (25% do caminho) → snap left → dislike → reset ao centro
  - Entre 20-60 → snap de volta ao centro (sem ação)
- Reset sempre volta para `CENTER` (40) em vez de 0

**6. Integração com card drag (`dragProgress`)**
- Mapear `dragProgress` (-150..150) para posição (0..MAX_DRAG) com centro em 40:
  - Valor positivo → move knob para direita do centro
  - Valor negativo → move knob para esquerda do centro
- Reset externo volta ao centro

**7. Tap desativado** (ou tap alterna entre os dois lados com passagem pelo centro)

### Resultado visual
- Repouso: cápsula cinza neutra, knob no meio, sem ícone visível
- Arrastar direita: verde aparece suavemente, check surge no knob
- Arrastar esquerda: vermelho aparece suavemente, X surge no knob
- Soltar sem comprometimento: volta suavemente ao centro neutro

