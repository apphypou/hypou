# Revisão de Componentização & Tokenização

## Diagnóstico

### 1. Tokenização (violações do design system)
Regra do projeto: nunca usar cores cruas em componentes. Encontrado:

- **106 ocorrências** de `text-white` / `bg-black` / `bg-white` / `text-black`
- **72 ocorrências** de `hsl(...)` inline (deveria ser `hsl(var(--token))`)
- **24 hex codes** (`#xxxxxx`) hardcoded

Piores ofensores:
| Arquivo | text/bg-white/black | hsl() inline |
|---|---|---|
| `SwipeCard.tsx` | 41 | 12 |
| `ShortCard.tsx` | 17 | – |
| `Shorts.tsx` | 11 | – |
| `AdminDashboard.tsx` | – | 19 |
| `Match.tsx` / `Baixar.tsx` | – | 9 cada |
| `Item.tsx` | 8 | – |

### 2. Componentização (arquivos grandes / responsabilidades misturadas)
- `SwipeCard.tsx` — **746 linhas**: motion values, galeria, botões like/dislike, overlays, gradientes, info card. Mistura lógica de gesto + UI.
- `Conversa.tsx` — **691 linhas**: chat + mídia + banners de troca + header.
- `MeuPerfil.tsx` — 441 linhas.
- `Explorar.tsx` — 402 linhas (provavelmente OK, mas verificar).

### 3. shadcn / variantes
- `IconButton.tsx` e `NeonButton.tsx` definem estilos manuais com `cn(...)` em vez de usar `cva` (padrão shadcn). `button.tsx` shadcn já existe — duplicação de responsabilidade.
- `GlassCard.tsx` usa classe utilitária `.glass-card` do CSS, mas não há variants (hoverable é boolean) — poderia virar `cva` com variants `variant: default | hover | interactive`.

### 4. Tokens semânticos faltando
Cores usadas repetidamente em componentes que merecem token próprio:
- Verde (Hypou): `hsl(142 75% 50%)` → criar `--hype` / `--hype-foreground`
- Vermelho (Flopou): já tem `--danger` ✓ (mas SwipeCard usa hex)
- Overlays glass: `rgba(255,255,255,0.06)` repetido → token `--glass-surface`
- Cyan glow shadow: padronizar via utility `.neon-glow-*`

---

## Plano de execução (incremental, sem mudar comportamento)

### Fase 1 — Tokens (index.css + tailwind.config.ts)
1. Adicionar tokens: `--hype`, `--hype-foreground`, `--glass-surface`, `--glass-border`, `--overlay-strong`, `--overlay-soft`.
2. Mapear em `tailwind.config.ts` (`colors.hype`, `colors.glass.*`).
3. Criar utilities CSS para padrões repetidos: `.glass-button`, `.shadow-glow-primary`, `.shadow-glow-hype`, `.shadow-glow-danger`.

### Fase 2 — Refator de SwipeCard (alta prioridade)
Quebrar `SwipeCard.tsx` (746 linhas) em:
- `SwipeCard/index.tsx` — orquestrador + gestos
- `SwipeCard/CardGallery.tsx` — galeria de imagens + taps
- `SwipeCard/SwipeActionButtons.tsx` — botões Hypou/Flopou (com motion values via props)
- `SwipeCard/SwipeOverlays.tsx` — overlays "HYPOU"/"FLOPOU" sobre a carta
- `SwipeCard/CardInfo.tsx` — info do item (título, preço, localização)

Substituir todos os `hsl(...)` inline pelos novos tokens.

### Fase 3 — Padronizar botões via cva
- Converter `NeonButton` para `cva` com variants `primary | outline | ghost` × sizes.
- Converter `IconButton` para `cva` ou consolidar com `Button` do shadcn (`variant=ghost size=icon`).
- Avaliar se `NeonButton` deve virar variant do `Button` shadcn em vez de componente paralelo.

### Fase 4 — Limpeza de cores cruas restantes
Substituir em ordem por arquivo:
- `ShortCard.tsx`, `Shorts.tsx`, `Item.tsx`, `Matches.tsx`, `ListaEspera.tsx`, `Chamada.tsx`, demais.
- Regra: `text-white` → `text-foreground` (ou `text-primary-foreground` no contexto de fundo primary); `bg-black` → `bg-background` ou overlay token.

### Fase 5 — Quebrar Conversa.tsx (691 linhas)
- `Conversa/ChatHeader.tsx` (com TradeContextCard)
- `Conversa/MessageList.tsx`
- `Conversa/MessageInput.tsx` (texto + mídia)
- `Conversa/TradeBanners.tsx`

### Fase 6 — Atualizar `documentacao.md`
Registrar novos tokens, estrutura de pastas dos componentes refatorados, e padrão `cva` adotado.

---

## Detalhes técnicos

**Por que `cva`?** É o padrão oficial shadcn — gera classes determinísticas, suporta `VariantProps<typeof variants>` para tipagem automática, evita o `cn` manual espalhado.

**Por que quebrar SwipeCard agora?** Foi modificado 5x nas últimas mensagens (botões like/dislike). Arquivo grande + edições frequentes = alto risco de regressão. Quebrar isola superfícies de mudança.

**Estratégia de migração de cores:** PR/commit por arquivo, validando visualmente. Tokens criados antes de qualquer substituição para evitar quebra intermediária.

---

## Escopo desta proposta

Posso executar **tudo de uma vez** ou **uma fase por vez** (recomendo fase-a-fase para revisar visual). Qual prefere?

Sugestão: começar por **Fase 1 + Fase 2** (tokens + SwipeCard) que dá o maior ganho imediato.
