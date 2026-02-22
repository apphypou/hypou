

# Plano de Correcao UX/Layout -- Explorar

## Problemas e Solucoes

### 1. Botoes de Acao Cortados pelo BottomNav

**Causa**: O card usa `flex-1` dentro de um container com `max-h-[580px]`, mas os botoes ficam em `absolute bottom-6` dentro do card. O `BottomNav` tambem e `absolute bottom-0 z-50`, sobrepondo os botoes do card. Alem disso, o `main` tem `pb-8` que nao e suficiente para compensar a nav flutuante (~80px).

**Solucao**:
- Em `Explorar.tsx`: aumentar o `pb` do `main` para `pb-24` para dar espaco ao BottomNav
- Remover o `max-h-[580px]` fixo e deixar o card ocupar o espaco disponivel naturalmente com `flex-1`
- No `SwipeCard.tsx`: mover os botoes de acao para FORA do card, renderizando-os no `Explorar.tsx` como uma barra fixa abaixo do card (nao absolute dentro dele)

### 2. Falta de Respiro -- Padding do Conteudo

**Causa**: O conteudo do card tem `pb-28` mas os botoes em `absolute bottom-6` disputam esse espaco. O valor "R$XX,00" fica colado nos botoes.

**Solucao**:
- Separar botoes do card (item 1 acima) elimina a disputa
- Manter o conteudo com padding adequado sem precisar compensar botoes internos

### 3. Safe Area no Header

**Causa**: `pt-12` e fixo e nao respeita `safe-area-inset-top` em dispositivos com notch/dynamic island.

**Solucao**:
- No `ScreenLayout.tsx`: adicionar `pt-[env(safe-area-inset-top)]` como base
- No `Explorar.tsx` header: usar `pt-[max(3rem,env(safe-area-inset-top))]` para garantir minimo de 48px
- No `index.html`: garantir que `<meta name="viewport">` inclui `viewport-fit=cover`

### 4. Bug de Formatacao de Preco

**Causa**: Os dados no banco estao inconsistentes. Alguns itens armazenam o valor em centavos (iPhone 16 = 450000 = R$4.500,00), outros em reais inteiros (Honda CB = 28000 = R$28.000, mas `formatValue` divide por 100, mostrando R$280,00).

**Solucao**:
- Padronizar: tratar TODOS os valores no banco como **reais inteiros** (sem centavos)
- Alterar `formatValue` em `SwipeCard.tsx` e `Explorar.tsx` para NAO dividir por 100: `format(value)` em vez de `format(cents / 100)`
- Criar migration SQL para corrigir o iPhone 16 de 450000 para 4500 (valor real)
- Verificar e corrigir quaisquer outros itens com valores em centavos

### 5. Gradiente de Contraste Insuficiente

**Causa**: O gradiente inferior `from-background via-background/20 to-transparent` e muito transparente no meio, perdendo legibilidade sobre imagens claras.

**Solucao**:
- Aumentar a opacidade do gradiente: `from-background via-background/60 to-transparent`
- Aumentar a altura do gradiente com um segundo layer: adicionar `from-background/90 via-background/40` que cubra 60% da altura do card
- Adicionar `text-shadow` sutil nos textos sobre a imagem para garantir contraste

---

## Arquivos Modificados

### `src/components/SwipeCard.tsx`
- Remover os botoes de acao (X, Zap, Heart) do componente -- eles vao para o `Explorar.tsx`
- Corrigir `formatValue`: remover divisao por 100
- Fortalecer gradiente inferior: `via-background/60`
- Adicionar `text-shadow` no nome do item e valor
- Reduzir `pb-28` do conteudo para `pb-6` (botoes nao estao mais dentro)

### `src/pages/Explorar.tsx`
- Renderizar botoes de acao FORA do card, abaixo dele, como componente fixo
- Aumentar padding inferior do `main` para `pb-24`
- Remover `max-h-[580px]` e usar flex natural
- Corrigir `formatValue` (remover /100)
- Header: usar padding com safe-area-inset-top

### `src/components/ScreenLayout.tsx`
- Nenhuma mudanca necessaria (ja usa `100dvh` corretamente)

### `index.html`
- Garantir `viewport-fit=cover` no meta viewport

### Migration SQL
- Corrigir valores inconsistentes no banco (iPhone 16: 450000 -> 4500)

---

## Resultado Esperado

- Botoes de acao sempre visiveis e nao sobrepostos pelo BottomNav
- Conteudo do card com respiro adequado
- Header respeita safe-area em todos os dispositivos
- Precos exibidos corretamente (Honda CB = R$28.000, iPhone 14 = R$5.500)
- Texto legivel sobre qualquer tipo de imagem

