# Hypou — Design System

> **Regra absoluta:** Toda nova tela, componente ou funcionalidade DEVE seguir este documento. Leia-o antes de escrever qualquer código.

---

## 1. Identidade do Produto

| Campo | Valor |
|---|---|
| **Nome** | Hypou |
| **Propósito** | Plataforma de trocas (permutas) de bens entre pessoas |
| **Público** | Massa — pessoas comuns trocando celulares, videogames, motos, móveis, eletrônicos |
| **Tom de voz** | Seguro, simples e profissional. Sem gírias excessivas, sem linguagem elitista |
| **Idioma** | Português brasileiro |

### Glossário obrigatório

| ❌ Não usar | ✅ Usar |
|---|---|
| Permuta | Troca |
| Match | Proposta de Troca |
| Valor Estimado / Vale uns | Valor de mercado |
| Premium / Elite / Luxo | Conta Verificada |
| Meus Ativos | Meus Itens |
| Hot | Popular |
| Curtir | Tenho Interesse |
| Diferença de preço | Ajuste financeiro / Compensação em dinheiro |
| Estado do produto | Condição do item (Excelente, Bom, Marcas de uso) |

---

## 2. Paleta de Cores

Todas as cores são definidas em HSL no `src/index.css` e mapeadas no `tailwind.config.ts`. **Nunca use cores hardcoded nos componentes** — sempre use tokens semânticos.

### Cores principais

| Token | HSL | HEX | Uso |
|---|---|---|---|
| `--background` | `0 0% 3%` | `#080808` | Fundo global do app (preto) |
| `--foreground` | `0 0% 100%` | `#FFFFFF` | Texto principal |
| `--primary` | `184 100% 50%` | `#00EEFF` | Ciano neon — CTAs, destaques, glows |
| `--primary-foreground` | `174 30% 10%` | `#122524` | Texto sobre fundo primário |
| `--card` | `174 30% 13%` | `#173533` | Fundo de cards e painéis |
| `--secondary` | `174 20% 16%` | `#212E2D` | Fundos secundários, inputs |
| `--muted` | `174 20% 16%` | `#212E2D` | Áreas neutras |
| `--muted-foreground` | `200 10% 60%` | `#8F9A9C` | Texto secundário, labels |
| `--destructive` | `0 84.2% 60.2%` | `#E5484D` | Erros e ações destrutivas |
| `--success` | `142 71% 45%` | `#22C55E` | Confirmações, swipe like, status positivo |
| `--danger` | `0 84% 60%` | `#E5484D` | Alertas, swipe nope, ações perigosas |
| `--border` | `0 0% 100% / 0.12` | `rgba(255,255,255,0.12)` | Bordas padrão |
| `--ring` | `184 100% 50%` | `#00EEFF` | Ring de foco |

### Como usar no código

```tsx
// ✅ Correto — tokens semânticos
className="bg-background text-foreground border-primary"

// ❌ Errado — cores hardcoded
className="bg-black text-white border-[#00EEFF]"
```

---

## 3. Tipografia

| Propriedade | Valor |
|---|---|
| **Font family** | `Plus Jakarta Sans` (Google Fonts) |
| **Token Tailwind** | `font-display` |
| **Pesos usados** | 200 (thin), 300, 400, 500, 600, 700, 800 (extrabold) |
| **Títulos** | `text-3xl font-extrabold tracking-tight` ou `text-xl font-extrabold` |
| **Corpo** | `text-base font-light leading-relaxed` ou `text-sm font-medium` |
| **Labels** | `text-xs font-semibold uppercase tracking-widest text-muted-foreground` |
| **Badges** | `text-[10px] font-bold uppercase tracking-[0.1em]` |

### Efeito gradient-text

```css
.gradient-text {
  @apply text-transparent bg-clip-text;
  background-image: linear-gradient(to right, white, hsl(184 100% 50% / 0.8));
}
```

### Efeito text-glow

```css
.text-glow {
  text-shadow: 0 0 10px hsl(184 100% 50% / 0.5);
}
```

---

## 4. Componentes Base

### 4.1 `<NeonButton />` — `src/components/NeonButton.tsx`

Botão padrão do app com efeito neon.

| Prop | Tipo | Descrição |
|---|---|---|
| `variant` | `"primary" \| "outline" \| "ghost"` | Estilo visual |
| `size` | `"sm" \| "md" \| "lg"` | Tamanho (default: `md`) |
| `icon` | `LucideIcon` | Ícone opcional |
| `iconPosition` | `"left" \| "right"` | Posição do ícone (default: `right`) |

**Estilos por variante:**

- **primary**: `bg-primary text-primary-foreground rounded-full neon-glow` — fundo ciano, texto escuro
- **outline**: `border border-primary/30 text-primary rounded-full` — borda ciano, fundo transparente
- **ghost**: `text-muted-foreground rounded-full` — sem borda, texto cinza

**Border radius**: Sempre `rounded-full` (pill shape)

### 4.2 `<GlassCard />` — `src/components/GlassCard.tsx`

Card com efeito glassmorphism.

| Prop | Tipo | Descrição |
|---|---|---|
| `hoverable` | `boolean` | Adiciona glow no hover |
| `className` | `string` | Classes extras |

**Estilos aplicados:**
```
glass-card → background: rgba(26, 36, 37, 0.6); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.05)
rounded-[2rem]
```

### 4.3 `<ScreenLayout />` — `src/components/ScreenLayout.tsx`

Wrapper de tela — todas as páginas internas devem usar.

```tsx
<ScreenLayout>
  <header>...</header>
  <main>...</main>
  <BottomNav activeTab="explorar" />
</ScreenLayout>
```

**Estilos:** `relative flex flex-col h-[100dvh] bg-background text-foreground overflow-hidden font-display antialiased`

### 4.4 `<BottomNav />` — `src/components/BottomNav.tsx`

Barra de navegação inferior flutuante com design de pílula e efeito de vidro líquido.

| Prop | Tipo | Descrição |
|---|---|---|
| `activeTab` | `"explorar" \| "trocas" \| "chat" \| "perfil"` | Aba ativa |

**Estilos:** `fixed bottom-6 left-5 right-5` com `bg-background/40 backdrop-blur-2xl border border-foreground/8 rounded-full`

**Comportamento:**
- Indicador de cápsula sólida (`bg-foreground`) que desliza entre abas via Framer Motion (`layoutId="nav-pill"`)
- Ícones ativos invertem cor (`text-background`) sem rótulo de texto — estética minimalista
- Mensagens não lidas indicadas por ponto ciano (`bg-primary`) discreto sobre o ícone de Chat

**Tabs:**
- Explorar (Compass icon)
- Trocas (Handshake icon)
- Chat (MessageSquare icon)
- Perfil (UserCircle icon)

### 4.5 `<IconButton />` — `src/components/IconButton.tsx`

Botão circular para ações secundárias (filtros, voltar, etc).

**Estilos:** `h-11 w-11 rounded-full bg-muted/50 border border-foreground/10 backdrop-blur-sm`

### 4.6 `<SwipeCard />` — `src/components/SwipeCard.tsx`

Card de item arrastável (swipe) para o feed Explorar.

**Anatomia visual:**
1. **Borda de reflexo líquido** — Imagem do item borrada (`blur-xl saturate-150`) por trás do card, criando borda que reflete as cores da foto
2. **Card interno** — `rounded-[1.5rem]` com imagem fullscreen e galeria (tap na metade direita/esquerda para navegar)
3. **Glow de feedback** — Bordas brilham verde (`--success`) ao arrastar para direita e vermelho (`--danger`) para esquerda
4. **Stamps** — "HYPOU" (like) e "PASSAR" (dislike) aparecem com opacidade proporcional ao arraste
5. **Owner pill** — Mini-perfil do dono no topo esquerdo (`bg-black/30 backdrop-blur-xl rounded-full`)
6. **Image dots** — Indicadores de galeria no topo direito (pílula branca ativa, pontos brancos/40 inativos)
7. **Liquid Glass info panel** — Painel inferior visível **apenas na primeira imagem** da galeria com `bg-white/15 backdrop-blur-2xl border border-white/20 rounded-[1.5rem]` contendo categoria, condição, nome, preço, localização e descrição

**Props:**

| Prop | Tipo | Descrição |
|---|---|---|
| `item` | `any` | Objeto do item com `item_images`, `profiles`, etc |
| `onSwipeComplete` | `(direction) => void` | Callback ao finalizar swipe |
| `onDragDirectionChange` | `(rawX) => void` | Progresso do arraste para sincronizar com SwipeToggle |
| `standby` | `boolean` | Modo inativo (card seguinte pré-renderizado por trás) |

### 4.7 `<SwipeToggle />` — `src/components/SwipeToggle.tsx`

Controle de ação alternativo ao swipe — ultra-minimalista via SVG inline.

**Design:** Fundo, knob e bordas são **totalmente invisíveis** (`fill="transparent"`). Exibem apenas:
- Setas de affordance ciano (chevrons `<` `>`) no estado neutro
- Ícone X vermelho ao arrastar para esquerda
- Ícone ✓ verde ao arrastar para direita
- Brilho radial colorido (vermelho/verde) que segue o knob

**Sincronização:** Recebe `dragProgress` (MotionValue) do card arrastável para mover o knob em sincronia com o arraste do card.

**Reset:** Estado do knob reseta instantaneamente ao `CENTER` a cada novo card (via `key={epoch}`).

### 4.8 `<NotificationBell />` — `src/components/NotificationBell.tsx`

Sino de notificações com badge de contagem.

**Comportamento responsivo:**
- **Mobile:** Abre como `<Drawer>` inferior (vaul) — mais natural para toque, `max-h-[85dvh]`
- **Desktop:** Popover flutuante animado com `bg-card/95 backdrop-blur-xl rounded-2xl shadow-2xl`

**Badge:** `h-5 min-w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold border-2 border-background`

**Empty state:** Ícone centralizado + texto "Nenhuma notificação" + subtexto explicativo

### 4.9 `<PullToRefresh />` — `src/components/PullToRefresh.tsx`

Wrapper que permite refresh por gesto de puxar para baixo (mobile).

---

## 5. Padrões de Tela

### 5.1 Header padrão

Todas as telas principais seguem o padrão de cabeçalho unificado:

```tsx
<header className="relative z-40 flex w-full justify-between items-center px-6 pt-6 pb-2 shrink-0">
  <div className="flex flex-col">
    <span className="text-[10px] uppercase tracking-[0.2em] text-primary/70 font-bold mb-0.5">
      Label Ciano
    </span>
    <h1 className="text-foreground text-3xl font-extrabold tracking-tight">
      Título
    </h1>
  </div>
  {/* Ações à direita (ícones, badges) */}
</header>
```

**Regras:**
- `pt-6` otimizado para mobile (sem padding excessivo)
- Rótulo pequeno em ciano (`text-primary/70`) acima do título
- Título grande e bold (`text-3xl font-extrabold`)
- **Sem** indicadores numéricos de progresso (ex: "1/18")
- Ações à direita: ícones circulares (`h-9 w-9 rounded-full bg-card border border-foreground/10`)

### 5.2 Tela Explorar (`/explorar`)

**Estrutura:** Header → Filtros (colapsáveis) → SwipeCard → SwipeToggle → BottomNav

**Header:** Label "Descubra" + título "Explorar" + NotificationBell + botão de filtro

**Filtros:** Chips horizontais scrolláveis com `AnimatePresence` para animação de entrada/saída
- Chip ativo: `bg-primary text-primary-foreground`
- Chip preferido do usuário: `bg-primary/10 border-primary/30 text-primary`
- Chip inativo: `bg-card border border-foreground/10 text-foreground/50`

**SwipeCard:** Ocupa todo o espaço central (`flex-1`), com card seguinte pré-renderizado em `standby`

**SwipeToggle:** Fixo acima do BottomNav (`fixed bottom` com `calc(env(safe-area-inset-bottom) + 4.5rem)`)

**Streak indicator:** Aparece após 3+ likes seguidos com `bg-primary/20 border-primary/40 backdrop-blur-xl rounded-full`

**Empty state:** Emoji 🔍 + título + subtexto + botão "Limpar filtro" se houver filtro ativo

### 5.3 Tela Propostas (`/partidas`)

**Estrutura:** Header → Lista de GlassCards → Popup fullscreen de detalhes → BottomNav

**Header:** Label "Suas Trocas" + título "Propostas" + contador ciano com dot

**Cards de lista:**
- `<GlassCard hoverable>` com `active:scale-[0.98]`
- Imagem `aspect-[4/3]` sem degradê sobre a foto na listagem
- Badge de status no canto superior direito:
  - Nova: `bg-primary text-primary-foreground` (ciano)
  - Aceita: `bg-success text-white` (verde)
  - Pendente: `bg-foreground/10 text-foreground/70` (cinza)
- Info: nome bold + preço em `text-foreground` (contraste acessível) + localização
- Owner row: avatar + nome + botão "Conversar" para matches aceitos

**Popup de detalhes (fullscreen):**
- `fixed inset-0 bg-background/95 backdrop-blur-md`
- Botão voltar: `ArrowLeft` em `rounded-full bg-background/80 backdrop-blur-sm` com `safe-area-inset-top`
- Hero image: `object-contain bg-card` (não corta a imagem)
- Visualização de troca: Box `rounded-2xl bg-foreground/5 border border-foreground/10` com thumbnails dos dois itens + seta `ArrowRightLeft`
- Galeria extra: scroll horizontal com botões de zoom fullscreen
- Ações fixas no rodapé: `bg-gradient-to-t from-background` com `paddingBottom: max(1.5rem, env(safe-area-inset-bottom))`

**Empty state:** Ícone `Repeat2` em box `bg-primary/10` + texto + CTA "Explorar itens"

### 5.4 Tela Conversas (`/chat`)

**Estrutura:** Header → PullToRefresh → Lista de conversas → BottomNav

**Header:** Label "Negociações" + título "Conversas" + indicador de novas mensagens (texto ciano + dot com neon-glow)

**Cards de conversa:**
- Botão fullwidth com `rounded-2xl` e padding `p-4`
- Com não lidas: `bg-primary/5 border border-primary/20`
- Sem não lidas: `bg-card/30 border border-foreground/5`
- Avatar `h-14 w-14 rounded-full` com thumbnail do item como overlay (`h-6 w-6 absolute -bottom-1 -right-1`)
- Badge de não lidas: `h-5 min-w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold`
- Timestamps: `text-[10px]` com destaque ciano quando há não lidas
- Linha de contexto: `text-[10px] text-foreground/30` com "Meu item ↔ Item deles"

**Empty state:** Emoji 💬 + texto

### 5.5 Tela Conversa Individual (`/chat/:conversationId`)

**Estrutura:** Header com avatar → Mensagens scrolláveis → Input fixo no rodapé

**NÃO usa** `<ScreenLayout>` nem `<BottomNav>` — layout fullscreen dedicado: `h-[100dvh] bg-background`

**Header:** `px-4 pt-4 pb-3 border-b border-foreground/5 bg-background/80 backdrop-blur-xl`
- Botão voltar (ArrowLeft) circular + avatar clicável para perfil do usuário + nome + contexto da troca

**Bolhas de mensagem:**
- Enviada (minha): `bg-primary text-primary-foreground rounded-2xl rounded-br-md`
- Recebida: `bg-card border border-foreground/5 text-foreground rounded-2xl rounded-bl-md`
- Largura máxima: `max-w-[75%]`
- Hora: `text-[10px]` + ícones de leitura (Check / CheckCheck)

**Input:** `px-4 pb-8 pt-3 border-t border-foreground/5 bg-background/80 backdrop-blur-xl`
- Textarea com `bg-card/50 border border-foreground/10 rounded-2xl` (auto-resize via `max-h-32`)
- Botão enviar: `h-11 w-11 rounded-full bg-primary neon-glow` centralizado verticalmente (`items-center`)

### 5.6 Tela Meu Perfil (`/meu-perfil`)

**Estrutura:** Header com back + settings → Seção de perfil → Stats → Meus Itens → BottomNav

**Header:** IconButton(ArrowLeft) + "Meu Perfil" + IconButton(Settings)

**Seção de perfil:**
- Avatar `h-32 w-32 rounded-full` com borda neon: `border-2 border-primary neon-glow bg-background`
- Botão de câmera: `absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary border-2 border-background`
- Badge "Conta Verificada": `bg-gradient-to-r from-gray-900 to-black border border-primary/30 rounded-full`
- Botão "Editar Perfil": `rounded-full border border-primary/50 bg-primary/5` com texto `text-primary text-xs font-bold tracking-widest uppercase`

**Stats grid:** 3 colunas com `<GlassCard>` contendo valor e label
- Highlight (ex: rating): `border-primary/20 bg-primary/5 text-primary`
- Normal: `text-foreground` e `text-foreground/40`

**Meus Itens:**
- Título "Meus Itens" + link "Novo Item" em `text-primary text-xs font-bold uppercase`
- Cards: `<GlassCard hoverable>` com thumbnail `h-20 w-20 rounded-xl`, categoria em `text-primary`, nome bold, preço
- Ícone de delete: `Trash2 text-foreground/30 hover:text-destructive`

**Editar Perfil:** `<Sheet side="bottom">` com `rounded-t-3xl`, inputs com `bg-muted/50 border-foreground/10`, labels `text-foreground/60 text-xs font-bold uppercase tracking-wider`

**Delete item:** `<AlertDialog>` com ícone `AlertTriangle text-destructive` e botão `bg-destructive`

---

## 6. Efeitos Visuais (Utilities CSS)

Definidos em `src/index.css` na `@layer utilities`:

| Classe | Efeito |
|---|---|
| `glass-panel` | Painel sólido com transparência: `bg hsl(174 30% 13% / 0.95)` + sombra |
| `glass-card` | Card translúcido com `backdrop-filter: blur(12px)` |
| `neon-glow` | `box-shadow: 0 0 20px hsl(184 100% 50% / 0.3)` |
| `neon-glow-hover` | Glow aumentado no hover (0.4 opacity) |
| `text-glow` | `text-shadow` com ciano |
| `gradient-text` | Gradiente branco → ciano no texto |
| `dashed-border-glow` | Borda tracejada ciano com glow interno (upload areas) |
| `animate-float` | Animação de flutuação suave (6s loop) |
| `animate-float-delayed` | Flutuação com delay de 1s (7s loop) |
| `no-scrollbar` | Esconde scrollbar mantendo scroll funcional |

---

## 7. Espaçamento Padrão

### Layout de tela

| Área | Padding |
|---|---|
| Header | `px-6 pt-6 pb-2` (ou `pb-4` para telas de lista) |
| Main content | `px-5 pb-8 pt-2` (ou `px-6 pt-6 pb-8` em formulários) |
| Footer/CTAs | `p-6 pb-10` com `bg-gradient-to-t from-background` |
| BottomNav | `fixed bottom-6 left-5 right-5` |

### Cards e elementos

| Elemento | Espaçamento |
|---|---|
| Card interno | `p-7 pb-28` (com espaço para action buttons) |
| Card de lista (Matches) | `p-4` com `gap-4` entre items |
| Card de conversa | `p-4` com `gap-2` entre items |
| Inputs | `px-5 py-4 rounded-xl` |
| Badges | `px-3 py-1 rounded-full` |
| Gaps entre seções | `gap-4` ou `gap-6` |
| Margin entre título e conteúdo | `mb-6` a `mb-8` |

### Border radius padrão

| Elemento | Radius |
|---|---|
| Botões (NeonButton) | `rounded-full` (pill) |
| Cards grandes (swipe) | `rounded-[1.5rem]` com borda de reflexo `rounded-[1.65rem]` |
| Cards médios (GlassCard) | `rounded-[2rem]` |
| Cards pequenos | `rounded-2xl` (1rem) |
| Cards de conversa | `rounded-2xl` |
| Bolhas de mensagem | `rounded-2xl` com canto achatado (`rounded-br-md` ou `rounded-bl-md`) |
| Inputs | `rounded-xl` |
| Badges | `rounded-full` |
| Avatares | `rounded-full` |
| BottomNav | `rounded-full` |
| Notification icons | `rounded-xl` |

---

## 8. Padrões Responsivos

### Mobile-first

- Todas as telas são otimizadas para mobile (`h-[100dvh]`, safe-areas, touch targets ≥ 44px)
- `env(safe-area-inset-bottom)` para bottom actions em dispositivos com notch
- Feedback tátil: `active:scale-[0.98]` em cards clicáveis, `active:scale-90` em botões de ação
- Navegação por gesto: PullToRefresh no chat, swipe nos cards do Explorar

### Adaptação desktop

- `<NotificationBell>` usa `useIsMobile()` para alternar entre drawer (mobile) e popover (desktop)
- Cards e listas usam `max-w-md` ou `max-w-xs` para limitar largura em telas grandes

---

## 9. Padrões de Dados Mock

Para protótipos e testes, usar itens do público de massa:

| Item | Valor | Categoria |
|---|---|---|
| iPhone 15 Pro Max | R$ 6.500 | Celular |
| PlayStation 5 + Jogos | R$ 3.200 | Videogame |
| Honda CB 500F | R$ 28.000 | Moto |
| MacBook Air M2 | R$ 5.800 | Notebook |
| Sofá Retrátil 3 Lugares | R$ 2.400 | Móvel |
| iPhone 14 Pro | R$ 4.800 | Celular |
| Honda CG 160 | R$ 12.000 | Moto |
| Apple Watch Series 9 | R$ 2.500 | Acessório |

**Localizações:** São Paulo SP, Campinas SP, Belo Horizonte MG, Rio de Janeiro RJ, Curitiba PR

---

## 10. Regras para Novas Telas

1. **Sempre** usar `<ScreenLayout>` como wrapper (exceto telas de conversa individual que usam layout dedicado)
2. **Sempre** usar `<BottomNav>` em telas internas (exceto landing, onboarding e conversa individual)
3. **Sempre** usar `<NeonButton>` para CTAs — nunca criar botões inline
4. **Sempre** usar tokens de cor (`bg-background`, `text-primary`, etc) — nunca HEX/RGB direto
5. **Sempre** seguir o padrão de header (label ciano + título bold) nas telas principais
6. **Sempre** manter tom democrático na copy — consultar glossário acima
7. **Sempre** usar `active:scale-[0.98]` em cards clicáveis para feedback tátil
8. **Nunca** usar itens de luxo nos mocks (mansões, Porsches, Rolexes)
9. **Nunca** usar fontes além de `Plus Jakarta Sans`
10. **Nunca** usar `rounded-xl` em botões — sempre `rounded-full`
11. **Nunca** usar degradês sobre imagens na listagem (reservado para painéis de informação dentro do card)
