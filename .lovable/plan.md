

## Plano: Upgrade Premium da Interface de Shorts

Analisei a implementacao atual e o screenshot. A interface funciona mas esta longe do nivel TikTok/Reels. Segue o plano de melhorias:

---

### 1. Transicao Animada entre Videos (Slide Vertical)

**Problema:** Atualmente usa `scrollTo` que depende do scroll nativo -- sem animacao fluida entre cards.

**Solucao:** Substituir o scroll container por um sistema baseado em `framer-motion` com `AnimatePresence`. Renderizar apenas 3 videos por vez (anterior, atual, proximo) e animar a transicao com slide vertical (`y: "100%"` -> `y: 0` -> `y: "-100%"`). Isso elimina jank e garante transicoes suaves tipo TikTok.

---

### 2. Barra de Progresso do Video

**Problema:** Nao ha indicacao de quanto do video ja foi assistido.

**Solucao:** Adicionar uma barra de progresso fina (2px) na parte inferior do ShortCard, acima do overlay. Atualizar via `timeupdate` event do video. Cor primaria do app, sem interacao (apenas visual).

---

### 3. Sidebar de Acoes Refinada (Estilo TikTok)

**Problema:** Os botoes da sidebar estao funcionais mas sem micro-animacoes e sem o polimento visual do TikTok.

**Melhorias:**
- Animacao de "bounce" no like com `framer-motion` (spring) ao curtir
- Avatar do perfil com borda animada (ring pulsante tipo "story") e icone "+" sobreposto para seguir
- Botao de comentarios (MessageCircle) -- mesmo sem backend de comentarios, preparar o slot
- Icone de bookmark/salvar para futuro
- Aumentar levemente o gap e usar sombras mais fortes nos icones

---

### 4. Bottom Overlay Redesign

**Problema:** O overlay inferior esta basico -- texto simples sem hierarquia visual forte.

**Melhorias:**
- Username com `@` em bold + badge verificado (opcional)
- Descricao do item com truncamento "ver mais" (expandir ao tocar)
- Tag de categoria como chip colorido pequeno (nao so texto)
- Preco com destaque visual (badge ou background sutil)
- CTA "Quero Trocar" com gradiente animado e icone de setas (ArrowLeftRight)
- Ticker/marquee horizontal para nomes longos de produto

---

### 5. Header Fixo com Logo + Filtros

**Problema:** Filtros somem e reaparecem de forma confusa. Nao ha identidade do app no topo.

**Solucao:**
- Header fixo sempre visivel com: logo "Hypou" a esquerda + tabs "Para Voce" / "Seguindo" ao centro (estilo TikTok)
- Icone de busca a direita
- Categorias movidas para um sheet/drawer acessivel via icone de filtro, removendo a poluicao visual do topo
- Remover o comportamento de auto-hide dos filtros

---

### 6. Indicador de Navegacao e Loading

- Skeleton/shimmer enquanto o proximo video carrega (se houver latencia)
- Indicador sutil de "arraste para cima" no primeiro video (seta animada)
- Haptic feedback visual (pulso sutil) ao chegar no ultimo video

---

### 7. Esconder BottomNav na Tela de Shorts

**Problema:** O BottomNav ocupa espaco valioso na tela full-screen dos shorts, quebrando a imersao (TikTok e Reels escondem a nav durante o feed).

**Solucao:** Nao renderizar o BottomNav na pagina de Shorts. Adicionar um botao de "voltar" ou gesto de swipe lateral para sair. O BottomNav ja nao e renderizado diretamente no Shorts.tsx, entao basta garantir que o layout pai nao o injete.

---

### 8. Melhorias de Performance

- Renderizar apenas 3 ShortCards por vez (virtualizacao manual)
- Preload do proximo video (`preload="auto"` apenas no idx+1)
- Lazy load dos videos distantes

---

### Arquivos Modificados

| Arquivo | Mudanca |
|---|---|
| `src/components/ShortCard.tsx` | Redesign completo: progress bar, sidebar refinada, bottom overlay premium, animacoes |
| `src/pages/Shorts.tsx` | Transicao animada com framer-motion, header fixo, virtualizacao, remover scroll-based navigation |
| `src/components/BottomNav.tsx` | Nenhuma mudanca necessaria (Shorts ja nao usa BottomNav) |

---

### Resumo Visual

```text
+----------------------------------+
|  Hypou    [P/ Voce] [Seguindo] Q |  <- Header fixo
|                                  |
|                                  |
|         [VIDEO FULLSCREEN]       |
|                                  |
|                           [Like] |
|                           [View] |
|                           [Chat] |
|                          [Share] |
|                          [Save]  |
|  @username                [Avt]  |
|  [Categoria]                     |
|  Nome do Produto                 |
|  R$ 2.500                        |
|  [====== QUERO TROCAR ======]    |
|  ━━━━━━━━━━━━━━━━━━ (progress)   |
+----------------------------------+
```

