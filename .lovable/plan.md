

## Plano: Efeito de Baralho com Pilha Real de 3 Cards

### Problema Atual

A implementação separa a "borda decorativa" do conteúdo do card, e o terceiro card usa uma prévia simplificada. Isso impede o efeito visual de "baralho" onde as bordas dos próximos cards aparecem nitidamente atrás do ativo.

### Mudanças em `src/pages/Explorar.tsx`

**1. Terceiro card (fundo) — SwipeCard completo:**
- Substituir o `div` simplificado por um `<SwipeCard>` completo dentro de um `motion.div`
- Props: `disabled`, `pointer-events-none`
- Estilo: `scale(0.90)`, `translateY(30px)`, `opacity: 0.4`, `zIndex: 8`

**2. Segundo card (próximo) — Unificar borda e conteúdo:**
- Remover a separação entre "decorative border shell" e o SwipeCard interno
- Aplicar `scale` e `y` diretamente no `motion.div` que contém o `<SwipeCard>`
- O card inteiro (com suas bordas naturais) escala junto, criando o efeito de baralho visível
- Estilo: `scale(0.95)`, `translateY(15px)`, `opacity: 1`, `zIndex: 9`

**3. Atualizar interpolações de drag:**
- `nextY`: `[15, 0]` (era `[10, 0]`)
- `thirdY`: `[30, 15]` (era `[20, 10]`)
- `thirdOpacity`: `[0.4, 1.0]` (era `[0.5, 1.0]`)
- Scales mantidos: `0.95→1.0` e `0.90→0.95`

**4. Transição de reposição:**
- Quando o card ativo sai, os cards de trás animam suavemente para cima via as interpolações já vinculadas ao `dragProgress`
- O `dragProgressValue.set(0)` no `advanceCard` reseta as posições, e o framer-motion interpola automaticamente

```text
Visão lateral da pilha:

  ┌──────────────┐  z:10  scale:1.00  y:0    ← Ativo (draggable)
 ┌──────────────┐   z:9   scale:0.95  y:15   ← Próximo (borda visível)
┌──────────────┐    z:8   scale:0.90  y:30   ← Fundo (opacity 0.4)
```

### Arquivo modificado

| Arquivo | Mudança |
|---|---|
| `src/pages/Explorar.tsx` | Unificar borda+conteúdo no card 2, SwipeCard completo no card 3, ajustar y-offsets para 15/30px |

