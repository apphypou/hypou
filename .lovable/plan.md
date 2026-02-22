

# Fix: Transicao instantanea entre cards

## Problema

O `AnimatePresence mode="popLayout"` esta aplicando uma animacao de **saida** (exit: opacity 0, scale 0.9, y -50) no card antigo ao mesmo tempo que o novo card aparece. Isso cria aquele "pulo" visual -- voce ve o card antigo encolhendo/sumindo enquanto o novo surge por baixo.

O card ja anima sua saida via `animate(x, 600)` (desliza para fora). A animacao de exit do `AnimatePresence` e **redundante** e conflita com a saida natural do swipe.

## Solucao

1. **Remover `AnimatePresence`** ao redor do `SwipeCard` -- nao precisamos de animacao de exit gerenciada pelo React porque o card ja sai via spring do `x`
2. **Remover `exit` prop** do `SwipeCard` -- sem AnimatePresence, exit nao faz nada
3. O resultado: quando `advanceCard` muda o index/epoch, o SwipeCard antigo desmonta instantaneamente (ja esta fora da tela nesse ponto) e o novo monta no lugar com `initial={false}` -- zero transicao visivel

## Mudancas Tecnicas

### `src/pages/Explorar.tsx`
- Linha 314: remover `<AnimatePresence mode="popLayout">`
- Linha 323: remover `</AnimatePresence>`
- Manter o `key` no SwipeCard para forcar remontagem

### `src/components/SwipeCard.tsx`
- Linha 122-123: remover `animate` e `exit` props do motion.div principal
- Manter `initial={false}` para garantir que o card aparece sem animacao

## Resultado

Card atual sai deslizando pelo spring -> `onSwipeComplete` dispara -> index avanca -> novo SwipeCard monta instantaneamente na posicao central, sem nenhuma animacao de transicao. Hiperfluido.

