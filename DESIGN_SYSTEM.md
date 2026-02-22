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
| **Títulos** | `text-3xl font-bold tracking-tight` ou `text-xl font-extrabold` |
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

Barra de navegação inferior flutuante.

| Prop | Tipo | Descrição |
|---|---|---|
| `activeTab` | `"explorar" \| "trocas" \| "chat" \| "perfil"` | Aba ativa |

**Estilos:** `glass-panel rounded-[2rem]` posicionado de forma absoluta (`absolute bottom-6`)

**Tabs:**
- Explorar (Search icon)
- Trocas (Repeat icon)
- Chat (MessageCircle icon)
- Perfil (User icon)

### 4.5 `<IconButton />` — `src/components/IconButton.tsx`

Botão circular para ações secundárias (filtros, voltar, etc).

**Estilos:** `h-11 w-11 rounded-full bg-muted/50 border border-foreground/10 backdrop-blur-sm`

---

## 5. Efeitos Visuais (Utilities CSS)

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

## 6. Espaçamento Padrão

### Layout de tela

| Área | Padding |
|---|---|
| Header | `px-6 pt-12 pb-4` |
| Main content | `px-5 pb-8 pt-2` (ou `px-6 pt-6 pb-8` em formulários) |
| Footer/CTAs | `p-6 pb-10` com `bg-gradient-to-t from-background` |
| BottomNav | `absolute bottom-6 left-4 right-4` (margem de 16px dos lados) |

### Cards e elementos

| Elemento | Espaçamento |
|---|---|
| Card interno | `p-7 pb-28` (com espaço para action buttons) |
| Card de lista (Matches) | `p-4` com `gap-4` entre items |
| Inputs | `px-5 py-4 rounded-xl` |
| Badges | `px-3 py-1 rounded-full` |
| Gaps entre seções | `gap-4` ou `gap-6` |
| Margin entre título e conteúdo | `mb-6` a `mb-8` |

### Border radius padrão

| Elemento | Radius |
|---|---|
| Botões (NeonButton) | `rounded-full` (pill) |
| Cards grandes (swipe) | `rounded-[2.5rem]` |
| Cards médios | `rounded-[2rem]` |
| Cards pequenos | `rounded-2xl` (1rem) |
| Inputs | `rounded-xl` |
| Badges | `rounded-full` |
| Avatares | `rounded-full` |

---

## 7. Padrões de Dados Mock

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

## 8. Regras para Novas Telas

1. **Sempre** usar `<ScreenLayout>` como wrapper
2. **Sempre** usar `<BottomNav>` em telas internas (exceto landing e onboarding)
3. **Sempre** usar `<NeonButton>` para CTAs — nunca criar botões inline
4. **Sempre** usar tokens de cor (`bg-background`, `text-primary`, etc) — nunca HEX/RGB direto
5. **Sempre** manter tom democrático na copy — consultar glossário acima
6. **Nunca** usar itens de luxo nos mocks (mansões, Porsches, Rolexes)
7. **Nunca** usar fontes além de `Plus Jakarta Sans`
8. **Nunca** usar `rounded-xl` em botões — sempre `rounded-full`
