

## Plano: Redesign do SwipeToggle com affordance real

### Problemas identificados
1. Forma "osso" sem precedente mental — parece dois círculos grudados
2. Chevrons invisíveis (opacidade 0.25)
3. Cinza neutro parece "disabled"
4. Cor aparece globalmente sem direção
5. Sem feedback de confirmação após ação

### Solução proposta

**Trocar a forma de osso por uma cápsula pill clássica** (stadium shape) — `rx="45"` simples, reconhecível universalmente como slider/toggle.

**Knob maior com ícone mais visível:**
- Aumentar raio do knob de 34 para 38
- Chevrons neutros com opacidade 0.5 (não 0.25)
- Adicionar uma sutil borda de 1px `rgba(0,0,0,0.08)` no knob para profundidade

**Cor direcional com gradiente radial a partir do knob:**
- Em vez de opacidade global sobre a forma inteira, usar um `radialGradient` centrado na posição do knob
- A cor "emana" do knob conforme ele se move, criando senso de direção
- Isso dá a impressão de que o knob "pinta" a trilha

**Micro-feedback de confirmação:**
- Quando o snap dispara (like ou dislike), aplicar um scale pulse no knob (1.0 → 1.15 → 1.0) antes do reset
- Isso confirma visualmente que a ação foi registrada

**Fundo neutro mais quente:**
- Trocar `#D0D0D0` por algo mais vivo: `#E8E8ED` (cinza azulado sutil) que não parece "disabled"

### Mudanças em `src/components/SwipeToggle.tsx`

1. **Forma:** Trocar o `<path>` complexo (bone shape) por um `<rect>` com `rx="45"` (pill shape). Dimensões: `x="10" y="10" width="160" height="80"`
2. **Gradientes:** Manter red/green, adicionar `radialGradient` dinâmico centrado no knob (`cx` atualizado via `position`)
3. **Knob:** `r=38`, adicionar `stroke="#00000014" strokeWidth="1"` para borda sutil
4. **Chevrons:** Opacidade base de `neutralOpacity * 0.5` em vez de `0.25`
5. **Pulse no snap:** Adicionar estado `snapping` que aplica `transform: scale(1.15)` no knob por 150ms antes do reset
6. **Fundo neutro:** `#E8E8ED` → `#D8D8DE` no gradiente

Nenhum outro arquivo muda.

