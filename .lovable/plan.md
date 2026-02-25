

## Plano: Jelly Physics — Swipe Elástico e Tridimensional

### Resumo

Refatorar a mecânica de swipe para replicar a física "jelly/bouncy" do GIF de referência: rotação ancorada na base do card, stack com 3 cards animados, botões reativos ao arrasto, e spring physics elástica. O visual (cores, fontes, layout 60/40) permanece intacto.

---

### Mudanças Detalhadas

#### 1. `src/components/SwipeCard.tsx`

**Rotação com âncora na base:**
- Adicionar `transformOrigin: "bottom center"` ao card principal — simula o efeito de "pendurado pelo dedo"
- Ajustar a interpolação de rotação: `useTransform(x, [-200, 200], [-15, 15])` (era -18/18 com range -300/300)
- Remover `rotateY` e `imageX` (parallax 3D) — o GIF de referência usa apenas rotação 2D simples
- Remover `useSpring` do rotate — usar `useTransform` direto para resposta imediata ao dedo (a spring fica só no snap-back)

**Spring physics no snap-back:**
- Alterar o `animate(x, 0, ...)` de `stiffness: 800, damping: 25, mass: 0.5` para `stiffness: 400, damping: 25` — mais bouncy/elástico conforme referência

**Badges HYPOU/PASSAR:**
- Manter como estão (já mudam opacidade de 0→1 conforme arrasto) — consistente com a referência

**Glow borders:**
- Manter — adicionam feedback visual rico

**Exportar o `dragProgress` como prop para os botões reagirem:**
- Adicionar nova prop `onDragDirection?: (direction: number) => void` que passa o valor raw de X (positivo = like, negativo = dislike) para o pai controlar a escala dos botões

#### 2. `src/pages/Explorar.tsx`

**Stack de 3 cards — novas specs:**
- Card Ativo (index 0): `scale: 1`, `opacity: 1`, `zIndex: 10`
- Card 1 (próximo): `scale: 0.95`, `y: 10px`, `zIndex: 9`, `opacity: 1` (era 0.4 — agora totalmente visível)
- Card 2 (fundo): `scale: 0.90`, `y: 20px`, `zIndex: 8`, `opacity: 0.5` (era 0.2)
- Remover `blur` dos cards de fundo — a referência não usa blur
- Quando o card 0 sai, o card 1 anima suavemente para posição do 0 via `layout` transition ou spring interpolada pelo `dragProgress`

**Transição suave da stack durante arrasto:**
- Card 1: `scale` interpola de `0.95 → 1.0` conforme `dragProgress` vai de `0 → 1`
- Card 2: `scale` interpola de `0.90 → 0.95`, `opacity` de `0.5 → 1.0`
- Card 2: `y` interpola de `20 → 10`

**Micro-interação dos botões de ação:**
- Criar novo `useMotionValue` para a direção raw do arrasto (valor de X, não absoluto)
- Botão Coração (like): `scale` interpola de `1.0 → 1.3` quando X > 0, com `boxShadow` glow verde
- Botão X (dislike): `scale` interpola de `1.0 → 1.3` quando X < 0, com `boxShadow` glow vermelho
- Usar `useTransform` para vincular diretamente ao motion value — sem setState, zero re-renders

**zIndex do SwipeCard principal:**
- Garantir que o card ativo tenha `z-10` (já tem) e os de stack `z-[-1]` e `z-0` → mudar para `z-[8]` e `z-[9]` explícitos

---

### Detalhes Técnicos

```text
Stack visual (lateral):

  ┌─────────┐  z:10  scale:1.00  y:0    ← Card ativo (draggable)
 ┌─────────┐   z:9   scale:0.95  y:10   ← Próximo (visível, sem blur)  
┌─────────┐    z:8   scale:0.90  y:20   ← Fundo (opacity 0.5)

Durante arrasto → direita:
  - Card 1 cresce para scale 1.0
  - Card 2 cresce para scale 0.95
  - Botão ❤️ scale 1.3 + glow
  - Botão ✕ scale 1.0 (neutro)
```

**Propriedades de spring (snap-back):**
- `type: "spring"`, `stiffness: 400`, `damping: 25` — bounce visível mas controlado

**Transform-origin:**
- `transformOrigin: "50% 100%"` no card — rotação pivota da base

### Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `src/components/SwipeCard.tsx` | `transformOrigin` na base, rotação -15/15 sem spring, snap-back com stiffness 400, exportar direção do drag |
| `src/pages/Explorar.tsx` | Stack specs (scale/y/opacity/zIndex), remover blur, botões reativos ao drag via useTransform |

