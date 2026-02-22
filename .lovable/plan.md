

# Plano de Refatoracao -- Auditoria UX/UI Explorar

## 1. Performance e Delay no Swipe

### Analise Tecnica

O problema de "primeiro aparece so a imagem, depois carregam os textos" acontece porque:

- **Preload inexistente**: Quando o card atual sai, o proximo SwipeCard monta do zero. A imagem do proximo item ja esta visivel no card de preview (segundo da pilha), mas o SwipeCard completo (com textos, gradiente, botoes) precisa montar, fazer layout e pintar. Isso gera 1-2 frames onde a imagem ja aparece (vinda do preview) mas o conteudo textual ainda nao renderizou.
- **`await createSwipe` bloqueia a transicao**: Dentro de `handleSwipeComplete`, o `advanceCard()` so e chamado DEPOIS que `createSwipe` e a query de matches terminam. Isso adiciona 200-600ms de latencia de rede entre o card sair e o proximo aparecer. O usuario ve a pilha de preview (so imagem) durante esse tempo.
- **Preview cards so mostram imagem**: Os cards de preview (segundo e terceiro da pilha, linhas 276-310 do Explorar.tsx) renderizam apenas `<img>`, sem nenhum conteudo textual. Quando o card principal desmonta e o proximo monta, ha um frame onde o preview (so imagem) e visivel antes do SwipeCard completo pintar.

### Solucao

- **Transicao otimista**: Chamar `advanceCard()` IMEDIATAMENTE apos a animacao de saida completar, ANTES de fazer o `createSwipe`. A chamada de API roda em background (fire-and-forget com tratamento de erro silencioso). Isso elimina completamente o delay de rede.
- **Preload de imagem do proximo card**: Usar `new Image().src = nextImage` para pre-carregar a imagem do item seguinte no cache do browser enquanto o usuario ainda esta interagindo com o card atual.
- **Remover o flash do preview**: Adicionar conteudo textual (nome + valor) nos cards de preview para que, mesmo durante o frame de transicao, o usuario veja informacao consistente.

### Passos

```text
Passo 1.1: Refatorar handleSwipeComplete para chamar advanceCard()
           ANTES do await createSwipe (transicao otimista)
Passo 1.2: Mover createSwipe + match check para funcao async
           separada (fire-and-forget)
Passo 1.3: Adicionar preload de imagem via useEffect quando
           nextItem mudar
Passo 1.4: Adicionar nome e valor nos cards de preview
           (segundo e terceiro da pilha)
```

---

## 2. Layout, Responsividade e Safe Area

### Analise Tecnica

**Imagens distorcidas**: A imagem usa `object-cover scale-110` (linha 170 do SwipeCard), o que funciona para fotos de proporcao similar. Porem, itens como TVs e relogios com proporcoes extremas (muito largos ou muito altos) perdem partes importantes. Nao e distorcao (object-cover nao distorce), mas sim corte excessivo em proporcoes atipicas.

**Gradiente fraco**: O gradiente inferior (linha 180) usa `via-background/20`, que e quase transparente. Em fotos claras, o texto branco perde contraste. Nao ha text-shadow como fallback.

**Header sem safe-area**: O header usa `pt-12` fixo (linha 183 do Explorar), que nao respeita `env(safe-area-inset-top)`. Alem disso, o `index.html` nao tem `viewport-fit=cover` no meta viewport, entao as variaveis de safe-area-inset nao funcionam.

**Botoes colidindo com BottomNav**: Os botoes de acao estao em `absolute bottom-6` DENTRO do card (linha 219 do SwipeCard). O BottomNav e `fixed bottom-0` com ~60px de altura. O card usa `flex-1` e `pb-8` no main (linha 196 do Explorar), mas sem compensacao suficiente. Os botoes ficam a apenas ~24px acima do BottomNav -- zona de "fat finger".

### Solucao

- **Safe area no viewport**: Adicionar `viewport-fit=cover` no meta viewport do `index.html`.
- **Header com safe-area**: Trocar `pt-12` por `pt-[max(3rem,env(safe-area-inset-top))]`.
- **Extrair botoes do card**: Mover os 3 botoes de acao (X, Zap, Heart) para FORA do SwipeCard, renderizando-os no Explorar.tsx como uma barra separada entre o card e o BottomNav. Isso garante posicionamento previsivel e elimina sobreposicao.
- **Gradiente mais forte**: Mudar `via-background/20` para `via-background/60`, e adicionar um segundo layer de gradiente mais alto. Adicionar `text-shadow` nos textos sobre imagem.
- **Imagem com aspect-ratio**: Manter `object-cover` mas remover `scale-110` para reduzir corte. Adicionar `object-position: center` explicito.

### Passos

```text
Passo 2.1: Adicionar viewport-fit=cover no index.html
Passo 2.2: Header com safe-area-inset-top dinamico
Passo 2.3: Extrair botoes de acao do SwipeCard para Explorar.tsx
           (barra fixa entre card e nav, com gap adequado)
Passo 2.4: Aumentar padding-bottom do main para pb-40
           (card + botoes + gap + BottomNav)
Passo 2.5: Fortalecer gradiente: via-background/60,
           segundo layer, text-shadow nos textos
Passo 2.6: Remover scale-110 da imagem, manter object-cover
```

---

## 3. Feedback Visual e Microinteracoes

### Analise Tecnica

**Clique nos botoes sem animacao**: Quando o usuario clica no botao X ou Heart, `doExit` chama `animate(x, 600)` com spring. Isso DEVERIA animar a saida. Porem, o `onComplete` chama `onSwipeComplete` que, por sua vez, chama `handleSwipeComplete` que faz `await createSwipe` -- durante esse await, o card ja saiu visualmente mas nao desmontou. Quando o `advanceCard` finalmente roda, o card antigo desmonta e o novo aparece. O problema e que o delay de rede faz parecer que o card "sumiu" sem transicao (o usuario ja nao ve o card antigo, so a pilha de preview).

**Badges LIKE/NOPE existem mas podem nao estar visiveis**: Os badges estao implementados (linhas 142-163 do SwipeCard) com opacidade vinculada ao x. O texto "LIKE" e "NOPE" esta presente. Se o usuario relata que nao os ve, pode ser que:
  - Os badges dizem "LIKE" e "NOPE" em vez de "HYPOU" e "PASSAR" (branding errado)
  - O z-index (z-30) pode estar atras do conteudo (z-20 no conteudo, mas o gradiente pode cobrir)

**Streak bruto**: O indicador de streak ja usa AnimatePresence com fade, mas a transicao `initial={{ opacity: 0, scale: 0.5, y: 20 }}` pode parecer abrupta em telas pequenas.

### Solucao

- **Transicao otimista (Passo 1.1)** resolve o corte seco -- a animacao completa e o proximo card aparece instantaneamente.
- **Renomear badges**: Trocar "LIKE" por "HYPOU" e "NOPE" por "PASSAR" para manter branding.
- **Garantir visibilidade dos badges**: Aumentar z-index dos badges para z-40 (acima do conteudo z-20 e gradiente).
- **Streak mais suave**: Adicionar `transition={{ duration: 0.4, ease: "easeOut" }}` ao AnimatePresence do streak.

### Passos

```text
Passo 3.1: Renomear badges: "LIKE" -> "HYPOU", "NOPE" -> "PASSAR"
Passo 3.2: Aumentar z-index dos badges para z-40
Passo 3.3: Suavizar animacao do streak (duration 0.4s)
Passo 3.4: (Ja resolvido pelo Passo 1.1 -- transicao otimista
           elimina o "corte seco" nos cliques de botao)
```

---

## Roadmap de Execucao (Ordem de Prioridade)

```text
FASE 1 -- Performance (Critico)
  Passo 1.1: Transicao otimista (advanceCard antes do await)
  Passo 1.2: createSwipe fire-and-forget em background
  Passo 1.3: Preload de imagem do proximo item
  Passo 1.4: Conteudo textual nos cards de preview

FASE 2 -- Layout e Safe Area (Alto Impacto)
  Passo 2.1: viewport-fit=cover no index.html
  Passo 2.2: Safe-area no header
  Passo 2.3: Extrair botoes do SwipeCard para Explorar
  Passo 2.4: Padding inferior adequado no main
  Passo 2.5: Gradiente mais forte + text-shadow
  Passo 2.6: Remover scale-110 da imagem

FASE 3 -- Microinteracoes (Medio Impacto)
  Passo 3.1: Badges "HYPOU" / "PASSAR"
  Passo 3.2: Z-index dos badges
  Passo 3.3: Streak mais suave
```

### Arquivos Afetados

| Arquivo | Mudancas |
|---|---|
| `index.html` | viewport-fit=cover |
| `src/pages/Explorar.tsx` | Transicao otimista, botoes extraidos, preload, preview com texto, safe-area header, padding |
| `src/components/SwipeCard.tsx` | Remover botoes, gradiente forte, text-shadow, badges renomeados, z-index, remover scale-110 |

