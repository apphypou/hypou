

# Auditoria Completa do Swipe -- Todos os Bugs Encontrados e Plano de Correcao

## Bugs Identificados

### Bug 1: Query refetch retorna lista vazia (CAUSA PRINCIPAL da tela vazia)
O `getExploreItems` filtra items ja swipados no servidor. Apesar do `staleTime: Infinity`, se o componente remonta (ex: navegar e voltar), o React Query pode refazer a query e retornar 0 itens porque **todos 18 itens ja foram swipados no banco** (18 swipes existem agora). O cache so e preservado enquanto o componente nao desmonta.

### Bug 2: AnimatePresence com key repetida no loop
Quando o loop volta ao index 0, `key={currentItem.id}` e o mesmo ID de um card ja exibido. O `AnimatePresence` nao re-anima cards com a mesma key -- o card fica invisivel (opacity: 0 do `initial`).

### Bug 3: Motion value `x` compartilhado entre cards
O `useMotionValue(0)` e global. Quando o card antigo sai com `animate(x, 600)` e o novo entra, ambos usam o mesmo `x`. O `x.set(0)` em `advanceCard` interrompe a animacao de saida, causando "pulos" visuais.

### Bug 4: setTimeout fragil para coordenacao
O `setTimeout(250ms)` entre animar e trocar o card e arbitrario. Se a animacao de mola leva mais tempo, o novo card aparece antes do antigo sair. Se leva menos, ha um gap vazio.

### Bug 5: Race condition no flag `swiping`
`performSwipe` verifica `if (swiping) return` no inicio, mas so seta `setSwiping(true)` dentro de `handleSwipe` (chamado 250ms depois). Nesse intervalo, outro swipe pode disparar -- causando swipe duplo no mesmo item.

### Bug 6: Closure stale no setTimeout
`handleSwipe` e capturado no `useCallback` de `performSwipe`. Quando o setTimeout executa 250ms depois, `handleSwipe` pode referenciar um `currentItem` desatualizado se o estado mudou.

### Bug 7: Match detection ineficiente
Apos cada swipe, faz 2 queries extras ao banco (`matches.select` + single match) independente da direcao. Dislikes nunca geram match, mas ainda fazem essas queries.

---

## Plano de Implementacao

### 1. Separar motion values por card (Fix Bug 3)
Em vez de um `x` global, usar `useMotionValue` fresco para cada card. O approach: mover a logica do card para um componente filho `SwipeCard` que cria seu proprio `x`.

### 2. Usar `onAnimationComplete` em vez de setTimeout (Fix Bug 4 e 6)
Eliminar todos os `setTimeout` para coordenacao. Usar uma ref `pendingSwipe` para guardar a direcao, animar o card, e processar o swipe quando a animacao de saida completar via callback.

### 3. Controle de swiping com ref (Fix Bug 5)
Trocar `useState(swiping)` por `useRef(swiping)` para verificacao sincrona imediata, sem esperar re-render.

### 4. Adicionar epoch key para loop (Fix Bug 2)
Manter um contador `epoch` que incrementa a cada swipe. Usar `key={currentItem.id + '-' + epoch}` para garantir que AnimatePresence sempre trate como card novo, mesmo no loop.

### 5. Nao refiltrar items ja carregados (Fix Bug 1)
Separar o cache de items exploraveis: ao carregar, guardar os items em um `useState` local. O loop roda sobre esse array fixo. Adicionar um botao "Recarregar" para buscar novos itens quando o usuario quiser. Isso evita que refetches apaguem a lista.

### 6. Skip match check em dislikes (Fix Bug 7)
So verificar matches quando `direction === "like" || direction === "superlike"`.

---

## Mudancas Tecnicas

### Arquivo: `src/pages/Explorar.tsx`

**Novo componente `SwipeCard` (extraido do card principal):**
- Recebe `item`, `onSwipeComplete`, `onButtonSwipe` como props
- Cria seu proprio `useMotionValue(0)` para `x`
- Contem toda a logica visual (glow, stamps, parallax, image, content, buttons)
- Expoe metodo `triggerSwipe(direction)` via `useImperativeHandle`

**Mudancas no componente `Explorar`:**
- Estado `localItems` (useState) inicializado a partir do resultado da query
- Estado `epoch` (number) incrementado a cada swipe para key unica
- Ref `swipingRef` (useRef boolean) em vez de `useState(swiping)`
- `advanceCard` simplificado: so incrementa index (sem manipular x)
- `handleSwipe` sem setTimeout -- chamado diretamente pelo `SwipeCard` apos animacao completar
- Match check so para likes/superlikes
- Remover `queryClient` da dep array de `advanceCard`

**Fluxo novo do swipe:**
1. Usuario arrasta ou clica botao
2. `SwipeCard` anima seu `x` local para +/-600 (spring)
3. Ao completar animacao, chama `onSwipeComplete(direction)`
4. `Explorar` verifica `swipingRef`, registra swipe no banco, avanca card
5. Novo `SwipeCard` monta com key unica e `x` fresco em 0

**Stack de cards (next/third):**
- Mantidas como estao, mas sem depender do `x` do card principal
- Usam `dragProgress` derivado de um callback do `SwipeCard`

