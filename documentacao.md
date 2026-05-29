# 📘 Hypou — Documentação Técnica Completa

> **Versão:** 1.1 · **Última atualização:** 2026-04-24
> **URL de produção:** https://hypou.lovable.app

## ⚡ Estratégia de Performance (Instant Load)

Implementada para tornar a navegação instantânea e reduzir bundles iniciais:

- **Code-splitting (`React.lazy` + `Suspense`)** em `src/App.tsx`. Apenas `Index`, `Login` e `Explorar` são eager-loaded. Demais rotas carregam sob demanda. Fallback do Suspense é um `div` vazio (sem spinner) para evitar flash em chunks rápidos.
- **Transições enxutas** (`src/components/PageTransition.tsx`): apenas opacidade, duração 0.12s, sem translate. `AnimatePresence` em `mode="popLayout"` com `initial={false}`.
- **Prefetch on hover/touch** em `BottomNav` (`onPointerEnter`/`onTouchStart`) — chunks das próximas telas baixam antes do clique.
- **React Query** com `staleTime: 5min`, `gcTime: 30min`, `refetchOnWindowFocus: false`, `refetchOnMount: false`, `retry: 1`. Elimina skeletons ao alternar abas.
- **Query keys unificadas** (`["onboarding-check", userId]`) entre `ProtectedRoute` e `Explorar` — uma única chamada Supabase.
- **`manualChunks`** em `vite.config.ts` separa `react-vendor`, `framer`, `supabase`, `query` para melhor cache do navegador entre deploys.
- **`<link rel="preconnect">`** para o domínio Supabase em `index.html` reduz TTFB do primeiro request.

---

## Sumário

1. [Visão Geral do Produto](#1-visão-geral-do-produto)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Arquitetura da Aplicação](#3-arquitetura-da-aplicação)
4. [Estrutura de Diretórios](#4-estrutura-de-diretórios)
5. [Roteamento e Navegação](#5-roteamento-e-navegação)
6. [Design System](#6-design-system)
7. [Componentes Base](#7-componentes-base)
8. [Banco de Dados (Supabase)](#8-banco-de-dados-supabase)
9. [Autenticação e Autorização](#9-autenticação-e-autorização)
10. [Camada de Serviços](#10-camada-de-serviços)
11. [Hooks Customizados](#11-hooks-customizados)
12. [Fluxos de Negócio](#12-fluxos-de-negócio)
13. [Realtime e Notificações](#13-realtime-e-notificações)
14. [Storage e Upload de Mídia](#14-storage-e-upload-de-mídia)
15. [Edge Functions](#15-edge-functions)
16. [Painel Administrativo](#16-painel-administrativo)
17. [Segurança (RLS e Políticas)](#17-segurança-rls-e-políticas)
18. [SEO e PWA](#18-seo-e-pwa)
19. [Testes](#19-testes)
20. [Glossário](#20-glossário)

---

## 1. Visão Geral do Produto

**Hypou** é uma plataforma de troca de itens do dia a dia baseada em mecânica de **swipe + match**. Substitui o ciclo "vender para comprar" por uma negociação direta (escambo moderno).

### Proposta de Valor
- Eliminar fricção na troca de bens usados
- Sistema de match inteligente baseado em valor e categorias
- Chat integrado para combinar entregas
- Avaliação de confiança entre usuários

### Público-alvo
- Público de massa brasileiro que deseja trocar itens parados em casa

### Idioma
- Interface 100% em português brasileiro (pt-BR)
- Rotas em português (`/explorar`, `/partidas`, `/meu-perfil`)

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| **Framework** | React | 18.3 |
| **Build Tool** | Vite | 5.x |
| **Linguagem** | TypeScript | 5.x |
| **Estilização** | Tailwind CSS | 3.x |
| **Componentes UI** | shadcn/ui (Radix UI) | — |
| **Animações** | Framer Motion | 12.x |
| **Roteamento** | React Router DOM | 6.x |
| **Estado do Servidor** | TanStack React Query | 5.x |
| **Backend (BaaS)** | Supabase | 2.x |
| **Formulários** | React Hook Form + Zod | — |
| **Gráficos** | Recharts | 2.x |
| **Ícones** | Lucide React | 0.462 |
| **Toasts** | Sonner + Radix Toast | — |

### Ferramentas de Dev
- ESLint 9 com flat config
- Vitest para testes unitários
- PostCSS + Autoprefixer
- Plugin PWA (`vite-plugin-pwa`)
- Lovable Tagger para deploy tags

---

## 3. Arquitetura da Aplicação

### Padrão Arquitetural
A aplicação segue uma arquitetura **client-side SPA** com backend serverless (Supabase). Não há servidor Node.js customizado.

```
┌─────────────────────────────────────────────────────┐
│                    Cliente (React SPA)               │
│                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │  Pages   │──│  Hooks   │──│    Services      │   │
│  │ (Views)  │  │ (Logic)  │  │ (Data Access)    │   │
│  └──────────┘  └──────────┘  └────────┬─────────┘   │
│                                        │             │
└────────────────────────────────────────┼─────────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │              Supabase                    │
                    │                                          │
                    │  ┌──────┐ ┌────────┐ ┌───────────────┐  │
                    │  │ Auth │ │Postgres│ │   Storage     │  │
                    │  │      │ │ + RLS  │ │  (Buckets)    │  │
                    │  └──────┘ └────────┘ └───────────────┘  │
                    │  ┌──────────┐  ┌─────────────────────┐  │
                    │  │ Realtime │  │  Edge Functions     │  │
                    │  └──────────┘  └─────────────────────┘  │
                    └─────────────────────────────────────────┘
```

### Separação de Responsabilidades

| Camada | Localização | Responsabilidade |
|--------|-------------|------------------|
| **Pages** | `src/pages/` | Telas da aplicação, composição de componentes |
| **Components** | `src/components/` | UI reutilizável, apresentação |
| **Hooks** | `src/hooks/` | Lógica de estado, queries, subscriptions |
| **Services** | `src/services/` | Acesso a dados via Supabase SDK |
| **Constants** | `src/constants/` | Dados estáticos (categorias, condições) |
| **Lib** | `src/lib/` | Utilitários puros (validação, formatação) |

### Providers (Hierarquia)

```tsx
QueryClientProvider          // Cache e estado do servidor
  └─ ThemeProvider            // Tema claro/escuro
      └─ TooltipProvider      // Tooltips globais
          └─ BrowserRouter    // Roteamento
              └─ AuthProvider // Sessão do usuário
                  └─ Routes   // Definição de rotas
```

---

## 4. Estrutura de Diretórios

```
src/
├── assets/                   # Imagens e assets estáticos
├── components/
│   ├── admin/                # Componentes exclusivos do painel admin
│   │   ├── AdminProtectedRoute.tsx
│   │   ├── AdminSidebar.tsx
│   │   ├── KpiCard.tsx
│   │   ├── RealtimeActivityFeed.tsx
│   │   ├── CreateIncidentDialog.tsx
│   │   └── UpdateIncidentDialog.tsx
│   ├── ui/                   # Componentes shadcn/ui (Radix primitives)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── sheet.tsx
│   │   ├── tabs.tsx
│   │   └── ... (40+ componentes)
│   ├── BottomNav.tsx         # Navegação inferior flutuante
│   ├── GlassCard.tsx         # Card com efeito glassmorphism
│   ├── HypouLogo.tsx         # Logo da marca
│   ├── IconButton.tsx        # Botão icônico padronizado
│   ├── NeonButton.tsx        # Botão primário (pill/rounded-full)
│   ├── ProtectedRoute.tsx    # Guard de autenticação
│   ├── ScreenLayout.tsx      # Layout full-height padrão
│   ├── SwipeCard.tsx         # Card com drag/swipe (Framer Motion)
│   ├── SwipeToggle.tsx       # Toggle de modos de exploração
│   ├── NotificationBell.tsx  # Sino com badge de não-lidos
│   ├── PullToRefresh.tsx     # Pull-to-refresh nativo mobile
│   ├── OnboardingTour.tsx    # Tour de onboarding
│   ├── RatingDialog.tsx      # Dialog de avaliação de troca
│   ├── SelectItemDialog.tsx  # Seletor de item para proposta
│   ├── ChatSafetyDialog.tsx  # Aviso de segurança do chat
│   └── ...
├── constants/
│   └── categories.ts         # Categorias e condições de itens
├── hooks/
│   ├── useAuth.tsx           # Contexto de autenticação
│   ├── useTheme.tsx          # Contexto de tema (light/dark)
│   ├── useProfile.ts         # Perfil e itens do usuário
│   ├── useMatches.ts         # Propostas e matches
│   ├── useMessages.ts        # Mensagens e chat
│   ├── useNotifications.ts   # Notificações realtime
│   ├── useUnreadCount.ts     # Badge de não-lidos
│   ├── useRatings.ts         # Avaliações
│   ├── useGeolocation.ts     # Geolocalização do navegador
│   ├── use-mobile.tsx        # Detecção de viewport mobile
│   └── ...
├── integrations/
│   └── supabase/
│       ├── client.ts         # Instância do Supabase SDK
│       └── types.ts          # Tipos gerados do banco (read-only)
├── lib/
│   ├── utils.ts              # cn() e utilitários Tailwind
│   └── fileValidation.ts     # Validação de tipo/tamanho de arquivos
├── components/auth/         # Sistema unificado de telas de autenticação
│   ├── AuthScreen.tsx       # Wrapper padrão (back button, logo, título, footer)
│   ├── AuthInput.tsx        # Input com ícone esquerdo e slot direito (eye toggle)
│   ├── SocialAuthButtons.tsx# Botões Google/Apple reutilizáveis
│   └── PasswordStrengthMeter.tsx # Medidor de força de senha (4 níveis)
├── pages/
│   ├── Index.tsx             # Landing page
│   ├── Login.tsx             # Tela de login (usa AuthScreen + SocialAuthButtons)
│   ├── Cadastro.tsx          # Tela de registro (usa AuthScreen + SocialAuthButtons + PasswordStrengthMeter)
│   ├── Explorar.tsx          # Feed de swipe (tela principal)
│   ├── Busca.tsx             # Busca com filtros
│   ├── Shorts.tsx            # Feed de vídeos curtos
│   ├── Matches.tsx           # Propostas recebidas/enviadas
│   ├── Match.tsx             # Detalhe de um match
│   ├── Chat.tsx              # Lista de conversas
│   ├── Conversa.tsx          # Chat individual
│   ├── MeuPerfil.tsx         # Perfil do usuário logado
│   ├── PerfilUsuario.tsx     # Perfil de outro usuário
│   ├── Perfil.tsx            # Tela de onboarding/edição
│   ├── NovoItem.tsx          # Cadastro de item
│   ├── EditarItem.tsx        # Edição de item
│   ├── Configuracoes.tsx     # Configurações da conta
│   ├── ListaEspera.tsx       # Waitlist pré-lançamento
│   ├── Termos.tsx            # Termos de uso
│   ├── Privacidade.tsx       # Política de privacidade
│   ├── NotFound.tsx          # 404
│   └── admin/
│       ├── AdminLayout.tsx   # Layout com sidebar
│       ├── AdminDashboard.tsx # KPIs e gráficos
│       ├── AdminUsuarios.tsx  # Gestão de usuários
│       ├── AdminItens.tsx     # Gestão de itens
│       ├── AdminMatches.tsx   # Visualização de matches
│       ├── AdminReports.tsx   # Denúncias
│       ├── AdminWaitlist.tsx  # Lista de espera
│       ├── AdminStatus.tsx    # Status do sistema
│       └── AdminAssistente.tsx # Assistente IA
├── services/
│   ├── itemService.ts        # CRUD de itens + recomendação
│   ├── matchService.ts       # Propostas, aceite, confirmação
│   ├── messageService.ts     # Chat, mensagens, mídia
│   ├── searchService.ts      # Busca com filtros
│   ├── profileService.ts     # Perfil e avatar
│   ├── swipeService.ts       # Registro de swipes
│   ├── favoriteService.ts    # Favoritos
│   ├── reportService.ts      # Denúncias e bloqueios
│   └── videoService.ts       # Shorts (upload, like, view)
└── test/
    ├── setup.ts              # Configuração do Vitest
    ├── example.test.ts
    ├── itemService.test.ts
    ├── matchService.test.ts
    ├── notifications.test.ts
    ├── searchService.test.ts
    └── tradeFlow.test.ts
```

---

## 5. Roteamento e Navegação

### Rotas Públicas (sem autenticação)

| Rota | Componente | Descrição |
|------|-----------|-----------|
| `/` | `Index` | Landing page |
| `/lista-espera` | `ListaEspera` | Waitlist pré-lançamento |
| `/login` | `Login` | Autenticação (sempre modo escuro) |
| `/cadastro` | `Cadastro` | Registro de conta (sempre modo escuro) |
| `/confirmar-codigo` | `ConfirmarCodigo` | Verificação de código OTP de 6 dígitos enviado por e-mail (signup) |
| `/recuperar-senha` | `RecuperarSenha` | Esqueci minha senha (sempre modo escuro) |
| `/reset-password` | `ResetPassword` | Redefinir senha via link (sempre modo escuro) |
| `/termos` | `Termos` | Termos de uso |
| `/privacidade` | `Privacidade` | Política de privacidade |
| `/explorar` | `Explorar` | Feed público (modo visitante) |

> **Nota:** Todas as telas de autenticação (`/login`, `/cadastro`, `/recuperar-senha`, `/reset-password`) renderizam **sempre em modo escuro** via classe `dark` hardcoded, independente da preferência de tema do usuário. Isso garante consistência visual e melhor contraste com o logo da marca.

### Rotas Protegidas (autenticação + onboarding)

| Rota | Componente | Descrição |
|------|-----------|-----------|
| `/explorar` | `Explorar` | Feed de swipe com recomendações |
| `/busca` | `Busca` | Busca avançada |
| `/shorts` | `Shorts` | Feed de vídeos curtos |
| `/partidas` | `Matches` | Propostas recebidas/enviadas |
| `/match/:matchId` | `Match` | Detalhe de um match |
| `/chat` | `Chat` | Lista de conversas |
| `/chat/:conversationId` | `Conversa` | Conversa individual |
| `/meu-perfil` | `MeuPerfil` | Meu perfil + itens |
| `/configuracoes` | `Configuracoes` | Configurações da conta |
| `/novo-item` | `NovoItem` | Cadastrar item |
| `/editar-item/:itemId` | `EditarItem` | Editar item existente |
| `/usuario/:userId` | `PerfilUsuario` | Perfil público de outro usuário |

### Rotas Admin (autenticação + role `admin`)

| Rota | Componente | Descrição |
|------|-----------|-----------|
| `/admin` | `AdminDashboard` | Dashboard com KPIs |
| `/admin/usuarios` | `AdminUsuarios` | Gestão de usuários |
| `/admin/itens` | `AdminItens` | Gestão de itens |
| `/admin/matches` | `AdminMatches` | Visualização de matches |
| `/admin/reports` | `AdminReports` | Denúncias |
| `/admin/waitlist` | `AdminWaitlist` | Lista de espera |
| `/admin/status` | `AdminStatus` | Status do sistema |
| `/admin/assistente` | `AdminAssistente` | Assistente IA |

### Navegação Inferior (BottomNav)

Barra flutuante em formato de pílula com 4 abas:
1. **Explorar** (`Compass`) → `/explorar`
2. **Trocas** (`Handshake`) → `/partidas`
3. **Chat** (`MessageSquare`) → `/chat` (com badge de não-lidos)
4. **Perfil** (`UserCircle`) → `/meu-perfil`

Indicador de aba ativa: cápsula sólida (`bg-foreground`) com animação spring (`layoutId="nav-pill"`).

---

## 6. Design System

### 6.1 Filosofia Visual

**Tema Neutro-Escuro** com acentos em ciano. O modo escuro utiliza fundos cinza neutro puro (sem matizes de verde) para um visual premium e integrado.

### 6.2 Tipografia

- **Família:** `Plus Jakarta Sans` (Google Fonts)
- **Pesos:** 200–800
- **Uso:** Token `font-display` no Tailwind

### 6.3 Paleta de Cores (Tokens Semânticos)

Todas as cores são definidas em **HSL** via variáveis CSS em `index.css` e referenciadas via Tailwind.

#### Modo Claro (`:root`)

| Token | HSL | Uso |
|-------|-----|-----|
| `--background` | `210 20% 96%` | Fundo principal |
| `--foreground` | `210 25% 15%` | Texto principal |
| `--card` | `0 0% 100%` | Fundo de cards |
| `--primary` | `184 85% 42%` | Cor de destaque (ciano) |
| `--primary-foreground` | `0 0% 100%` | Texto sobre primary |
| `--secondary` | `210 15% 92%` | Fundo secundário |
| `--muted` | `210 15% 92%` | Elementos discretos |
| `--muted-foreground` | `210 10% 45%` | Texto discreto |
| `--destructive` | `0 72% 55%` | Ações destrutivas |
| `--success` | `142 60% 42%` | Sucesso / Like |
| `--danger` | `0 72% 55%` | Erro / Nope |
| `--border` | `210 15% 88%` | Bordas |
| `--ring` | `184 85% 42%` | Foco/ring |
| `--radius` | `1rem` | Border-radius padrão |

#### Modo Escuro (`.dark`)

| Token | HSL | Diferença principal |
|-------|-----|---------------------|
| `--background` | `0 0% 11%` | Cinza escuro neutro puro |
| `--foreground` | `0 0% 100%` | Branco puro |
| `--card` | `0 0% 15%` | Cinza neutro |
| `--primary` | `184 100% 50%` | Ciano mais vibrante |
| `--secondary` | `0 0% 18%` | Cinza neutro |
| `--border` | `0 0% 100% / 0.03` | Ultra-sutil (3% opacidade) |
| `--input` | `0 0% 100% / 0.05` | 5% opacidade |

### 6.4 Tokens semânticos de marca (Hypou / Flopou / Glass)

Adicionados em `index.css` (light + dark) e mapeados em `tailwind.config.ts`:

| Token | Uso |
|-------|-----|
| `--hype` / `--hype-foreground` | Botão Hypou (like) e overlays verdes |
| `--hype-glow` | Glow do botão Hypou ao arrastar |
| `--flop` / `--flop-foreground` | Botão Flopou (dislike) e overlays vermelhos |
| `--flop-glow` | Glow do botão Flopou ao arrastar |
| `--glass-surface` | Superfície glass base (`white/6`) |
| `--glass-surface-strong` | Superfície glass enfatizada (`white/10`) |
| `--glass-border` | Borda glass padrão (`white/15`) |
| `--overlay-scrim` | Scrim sobre mídia (`black/35`) |
| `--on-media` | Texto/ícone fixo branco sobre imagem/vídeo (independente do tema) |
| `--scrim` | Preto fixo para overlays escuros (independente do tema) |

Classes Tailwind disponíveis: `bg-hype`, `text-hype-foreground`, `bg-flop`, `text-flop-foreground`, `text-on-media`, `bg-scrim/40`, `border-on-media/10`, etc.

> **Regra de uso:** componentes que exibem conteúdo sobre **mídia** (fotos de itens, vídeos shorts, swipe cards) devem usar `text-on-media` / `bg-scrim` em vez de `text-white` / `bg-black`, mantendo a semântica e funcionando em ambos os temas.

### 6.5 Efeitos Visuais (Utilitários CSS)

| Classe | Descrição |
|--------|-----------|
| `.glass-panel` | Fundo sólido com sombra suave (light) / translúcido (dark) |
| `.glass-card` | Card com `backdrop-blur(12px)`, borda ultra-sutil no dark |
| `.glass-button` | Superfície glass para botões sobre mídia (usa tokens `--glass-*`) |
| `.neon-glow` / `.neon-glow-hover` | Box-shadow primary 30% / 40% |
| `.shadow-glow-hype` | Halo verde (Hypou) — usado pelo SwipeActionButtons |
| `.shadow-glow-flop` | Halo vermelho (Flopou) — usado pelo SwipeActionButtons |
| `.text-glow` | Text-shadow ciano (apenas dark) |
| `.gradient-text` | Texto com gradiente foreground → primary |
| `.no-scrollbar` | Oculta scrollbar (webkit + Firefox) |
| `.animate-float` | Animação flutuante (6s infinite) |

### 6.6 Padrão de componentização (cva)

`NeonButton` e `IconButton` foram migrados para `class-variance-authority` (padrão shadcn), expondo `VariantProps` tipados:

- `NeonButton` → `variant: primary | outline | ghost` × `size: sm | md | lg`
- `IconButton` → `variant: default | glass | ghost` × `size: sm | md | lg`

Regra do projeto: **não usar cores cruas** (`text-white`, `bg-black`, `hsl(...)` inline) em componentes — usar sempre tokens semânticos.

### 6.7 Responsividade

- **Mobile-first** (viewport principal: 390×844 CSS px)
- `viewport-fit=cover` para suporte a notch/safe-areas
- `env(safe-area-inset-*)` usado em headers e botões fixos

---


## 7. Componentes Base

### ScreenLayout
```tsx
// Layout full-height que envolve toda tela
<div className="relative flex flex-col h-[100dvh] bg-background text-foreground overflow-hidden font-display antialiased">
  {children}
</div>
```

### NeonButton
- Botão primário em formato **pílula** (`rounded-full`)
- Suporte a `forwardRef`
- Efeito glow opcional

### GlassCard
- Card com efeito glassmorphism
- Adapta-se entre light e dark mode automaticamente

### SwipeCard
- Card arrastável com **Framer Motion** (`drag="x"`)
- Threshold de swipe: **80px**
- Stamps visuais de Like/Nope durante arraste
- Galeria de imagens/vídeo integrada
- Detalhes expansíveis (perfil do dono, margem de troca, avaliação)
- API imperativa via `useImperativeHandle` (`triggerSwipe`)

### BottomNav
- Navegação flutuante em pílula
- `backdrop-blur-2xl` com opacidade adaptativa (80% light / 40% dark)
- Indicador de cápsula com `motion.div` (`layoutId`)
- Badge de mensagens não-lidas em tempo real

### NotificationBell
- Ícone de sino com badge de contagem
- Dropdown com lista de notificações
- Marcar como lida / marcar todas

---

## 8. Banco de Dados (Supabase)

### 8.1 Diagrama de Tabelas

```
auth.users (Supabase Auth)
    │
    ├──→ profiles (1:1)
    │       user_id → auth.users.id
    │
    ├──→ items (1:N)
    │       user_id → auth.users.id
    │       ├──→ item_images (1:N)
    │       ├──→ item_videos (1:N)
    │       └──→ favorites (N:M via user_id)
    │
    ├──→ swipes (1:N)
    │       swiper_id → auth.users.id
    │       item_id → items.id
    │
    ├──→ matches (N:M entre users)
    │       user_a_id, user_b_id → auth.users.id
    │       item_a_id, item_b_id → items.id
    │       ├──→ conversations (1:1)
    │       │       └──→ messages (1:N)
    │       └──→ ratings (1:N)
    │
    ├──→ notifications (1:N)
    ├──→ blocked_users (N:M)
    ├──→ reports (1:N)
    ├──→ user_categories (1:N)
    ├──→ user_roles (1:N)  ← RBAC
    └──→ video_likes (N:M)

Tabelas de sistema:
    ├── waitlist
    ├── site_settings (key-value para configs do site)
    ├── system_incidents
    │       └── incident_updates
    └── uptime_checks
```

### 8.2 Tabelas Principais

#### `profiles`
Extensão do `auth.users`. Criada automaticamente via trigger `handle_new_user()`.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `user_id` | uuid | Referência ao auth.users |
| `display_name` | text | Nome público |
| `avatar_url` | text | URL do avatar |
| `bio` | text | Biografia |
| `location` | text | Localização textual |
| `latitude/longitude` | float8 | Coordenadas GPS |
| `phone` | text | Telefone |
| `onboarding_completed` | bool | Flag de onboarding |
| `subscription_tier` | text | Tier de assinatura (default: `free`) |
| `terms_accepted_at` | timestamptz | Aceite dos termos |
| `chat_terms_accepted_at` | timestamptz | Aceite dos termos do chat |

#### `items`
Itens cadastrados para troca.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `name` | text | Nome do item |
| `description` | text | Descrição |
| `category` | text | Categoria (ver constantes) |
| `condition` | text | Condição: `new`, `like_new`, `used`, `worn` |
| `market_value` | int | Valor de mercado em centavos |
| `margin_up` | int | % de margem para cima (default: 15) |
| `margin_down` | int | % de margem para baixo (default: 10) |
| `location` | text | Localização do item |
| `status` | text | `active`, `inactive` |

#### `matches`
Propostas e negociações entre dois usuários.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `user_a_id` | uuid | Quem fez a proposta |
| `user_b_id` | uuid | Dono do item desejado |
| `item_a_id` | uuid | Item oferecido |
| `item_b_id` | uuid | Item desejado |
| `status` | text | `proposal` → `accepted` → `completed` / `rejected` |
| `confirmed_by_a` | bool | Confirmação de entrega pelo user A |
| `confirmed_by_b` | bool | Confirmação de entrega pelo user B |

#### `match_items`
Tabela de junção que permite **propostas com múltiplos itens** (até 3 do lado proponente, 1 do lado receptor). `matches.item_a_id`/`item_b_id` permanecem como item primário (compat).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `match_id` | uuid | FK para matches |
| `user_id` | uuid | Dono do item |
| `item_id` | uuid | FK para items |
| `side` | text | `a` (proponente, até 3) ou `b` (receptor, 1) |

- Trigger `enforce_match_items_limit`: garante limites por lado.
- RPC `create_proposal(p_my_item_ids uuid[], p_their_item_id uuid)`: cria match + match_items atomicamente, validando posse, status `active`, bloqueios e limite de 3.
- `handle_trade_completion` e `deactivate_items_on_trade_completion` consideram todos os itens em `match_items` ao concluir uma troca (inativam todos e cancelam outras propostas que envolvam qualquer um deles).

#### `conversations` e `messages`
Chat entre participantes de um match aceito.

- **conversations**: Vínculo 1:1 com match (constraint UNIQUE)
- **messages**: Tipos: `text`, `image`, `video`, `audio`
- Indicadores de leitura via `read_at`

### 8.3 Views

#### `public_profiles`
View pública que expõe dados seguros dos perfis (sem telefone, GPS, dados sensíveis).

### 8.4 Categorias e Condições

```typescript
// src/constants/categories.ts
categories = [
  "Celulares", "Carros & Motos", "Moda", "Casa",
  "Videogames", "Eletrônicos", "Esportes", "Livros",
  "Instrumentos", "Ferramentas", "Animais", "Outros"
];

conditions = ["Novo", "Seminovo", "Usado", "Bem usado"];
```

---

## 9. Autenticação e Autorização

### 9.1 Autenticação (Supabase Auth)

**Provider:** `AuthProvider` (`src/hooks/useAuth.tsx`)

- **Sign Up:** Email + senha + display_name (via `raw_user_meta_data`)
- **Sign In:** Email + senha (`signInWithPassword`)
- **Sign Out:** `supabase.auth.signOut()`
- **Recuperação de senha:** Código OTP de 6 dígitos enviado por email (sem link de fallback, garantindo compatibilidade total com apps nativos Capacitor)
- **Sessão:** Gerenciada via `onAuthStateChange` listener

### 9.2 Guards de Rota

#### `ProtectedRoute`
- Verifica autenticação
- Se `requireOnboarding=true` (default), redireciona para `/onboarding` se perfil não completou onboarding
- Redireciona para `/login` se não autenticado

#### `AdminProtectedRoute`
- Verifica autenticação
- Consulta `user_roles` para role `admin`
- Redireciona para `/` se não for admin

### 9.3 RBAC (Role-Based Access Control)

- Tabela `user_roles`: `user_id` + `role` (enum: `admin`, `moderator`, `user`)
- Função SQL `has_role(_user_id, _role)`: `SECURITY DEFINER` para evitar recursão RLS
- Políticas RLS usam `has_role()` para operações administrativas

---

## 10. Camada de Serviços

### `itemService.ts`
| Função | Descrição |
|--------|-----------|
| `createItem()` | Cria item no banco |
| `updateItem()` | Atualiza dados do item |
| `getItemById()` | Busca item com imagens |
| `deleteItemImage()` | Remove imagem de item |
| `uploadItemImage()` | Upload para Storage + registro no banco |
| `validateItemPrice()` | Validação de preço via Edge Function (IA) |
| `getRecommendedItems()` | Itens recomendados via RPC `recommended_items`, com fallback para itens ativos com foto quando a recomendação não exibe cards válidos |
| `getPublicExploreItems()` | Feed público para modo visitante |

### `matchService.ts`
| Função | Descrição |
|--------|-----------|
| `getMatches()` | Lista todas propostas do usuário com detalhes |
| `getMatch()` | Detalhe de um match específico |
| `createProposal()` | Cria proposta de troca |
| `acceptProposal()` | Aceita proposta (apenas `user_b`) |
| `rejectProposal()` | Recusa proposta (apenas `user_b`) |
| `confirmTrade()` | Confirma entrega (confirmação dupla) |

### `messageService.ts`
| Função | Descrição |
|--------|-----------|
| `getConversations()` | Lista conversas com último msg e unread count |
| `getMessages()` | Mensagens de uma conversa |
| `sendMessage()` | Envia mensagem (text/image/video/audio) |
| `uploadChatMedia()` | Upload de mídia do chat |
| `markMessagesAsRead()` | Marca mensagens como lidas |
| `subscribeToMessages()` | Subscrição Realtime para novas mensagens |

### `searchService.ts`
| Função | Descrição |
|--------|-----------|
| `searchItems()` | Busca com filtros (query, categoria, condição, preço, ordenação, paginação) |

### `profileService.ts`
| Função | Descrição |
|--------|-----------|
| `updateProfile()` | Atualiza perfil |
| `uploadAvatar()` | Upload de avatar |
| `saveUserCategories()` | Salva categorias de interesse |
| `getProfile()` | Busca perfil |

### `swipeService.ts`
| Função | Descrição |
|--------|-----------|
| `createSwipe()` | Registra swipe (like/dislike/superlike) |

### `favoriteService.ts`
| Função | Descrição |
|--------|-----------|
| `addFavorite()` / `removeFavorite()` | Toggle de favorito |
| `getFavorites()` | Lista favoritos com imagens e perfis |
| `isFavorited()` | Verifica se item é favorito |

### `reportService.ts`
| Função | Descrição |
|--------|-----------|
| `createReport()` | Cria denúncia |
| `blockUser()` / `unblockUser()` | Bloquear/desbloquear usuário |
| `getBlockedUsers()` | Lista de bloqueados |

### `videoService.ts`
| Função | Descrição |
|--------|-----------|
| `fetchShortsFeed()` | Feed de vídeos com ordenação e filtro |
| `toggleLike()` | Like/unlike via RPC |
| `incrementView()` | Incrementa visualização via RPC |
| `uploadVideo()` | Upload + geração de thumbnail |
| `deleteVideo()` | Remove vídeo |

---

## 11. Hooks Customizados

| Hook | Arquivo | Descrição |
|------|---------|-----------|
| `useAuth` | `useAuth.tsx` | Contexto de autenticação (user, session, signIn, signUp, signOut) |
| `useTheme` | `useTheme.tsx` | Tema light/dark com persistência em localStorage |
| `useProfile` | `useProfile.ts` | Perfil, itens e estatísticas do usuário logado |
| `useMatches` | `useMatches.ts` | Lista de matches e detalhe de match |
| `useConversations` | `useMessages.ts` | Lista de conversas (refetch 30s) |
| `useMessages` | `useMessages.ts` | Mensagens com Realtime + auto mark-as-read |
| `useSendMessage` | `useMessages.ts` | Mutation para envio de mensagem |
| `useUploadChatMedia` | `useMessages.ts` | Upload de mídia no chat |
| `useNotifications` | `useNotifications.ts` | Notificações com Realtime + mark as read |
| `useUnreadCount` | `useUnreadCount.ts` | Contagem de mensagens não-lidas (Realtime) |
| `useRatings` | `useRatings.ts` | Avaliações (média de usuário, rating de match) |
| `useGeolocation` | `useGeolocation.ts` | GPS do navegador + salvar no perfil |
| `useMobile` | `use-mobile.tsx` | Detecção de viewport mobile |
| `useAdminStats` | `useAdminStats.ts` | KPIs do painel admin |

---

## 12. Fluxos de Negócio

### 12.1 Fluxo de Onboarding

```
Registro → Trigger handle_new_user() cria profile
         → Redireciona para /onboarding
         → Preenche: nome, avatar, localização, categorias de interesse
         → Aceita termos
         → onboarding_completed = true
         → Redireciona para /explorar
```

### 12.2 Fluxo de Exploração e Swipe

```
/explorar → getRecommendedItems(userId)
          → RPC recommended_items (SQL complexo):
              - Filtra itens compatíveis em valor (margem ±%)
              - Remove já vistos (swipes)
              - Remove bloqueados
              - Prioriza mesma categoria
              - Retorna matched_item_id (qual item seu é compatível)
          → Hidrata imagens/vídeos/perfis e oculta itens sem foto
          → Se a lista final ficar vazia, busca itens ativos com foto de outros usuários
          → SwipeCard com drag gesture
          → Like → createSwipe("like") + abre SelectItemDialog
          → Dislike → createSwipe("dislike")
```

### 12.3 Fluxo de Proposta e Negociação

```
Like no item → Seleciona qual item meu oferecer
             → createProposal(userId, myItemId, theirItemId, theirUserId)
             → Insere match com status "proposal"
             → Trigger notify_on_match() notifica user_b

user_b recebe notificação → /partidas (Propostas Recebidas)
  → Aceitar: acceptProposal() → status = "accepted" + cria conversation
  → Recusar: rejectProposal() → status = "rejected"
```

Observação operacional: a tela `/partidas` sempre refaz a busca ao montar para evitar cache antigo de propostas. Após enviar proposta por Explorar, Favoritos ou Shorts, o app invalida imediatamente as queries `matches` e `profile-stats` do usuário remetente.
Para blindar a listagem contra falhas de join/RLS no cliente, `getMatches()` usa a RPC autenticada `get_my_matches()`, que retorna somente propostas onde `auth.uid()` participa, com itens, imagens e perfil público do outro usuário já agregados.

### 12.4 Fluxo de Conclusão da Troca

```
Match aceito → Chat liberado (/chat/:conversationId)
             → Usuários combinam entrega
             → Cada um confirma: confirmTrade()
                → confirmed_by_a = true / confirmed_by_b = true
             → Trigger check_trade_completion():
                → Se ambos confirmaram + status = "accepted"
                → status = "completed"
             → Trigger deactivate_items_on_trade_completion():
                → Desativa item_a e item_b (status = 'inactive')
                → Itens somem do feed de ambos os usuários
             → RatingDialog abre automaticamente para ambos
             → Avaliação visível no perfil público
```

### 12.4.1 Status da Troca no Chat (TradeContextCard)

| Status DB   | Label exibido no chat      |
|-------------|---------------------------|
| proposal    | Pendente ⏳                |
| accepted    | Em negociação 🤝          |
| completed   | Troca concluída ✅         |
| rejected    | Troca não realizada ❌     |

### 12.4.2 Desativação Automática de Itens

Quando ambos os usuários confirmam a entrega e o match atinge status `completed`, o trigger `deactivate_items_on_trade_completion()` (SECURITY DEFINER) automaticamente atualiza `items.status = 'inactive'` para os dois itens envolvidos. Itens inativos são filtrados do feed pela RLS (`status = 'active'`).

### 12.4.3 Avaliação Pós-Troca

- O `RatingDialog` abre automaticamente ao visualizar um match concluído sem avaliação
- Botão "Avaliar troca" disponível nos matches concluídos na aba Histórico
- Ratings são visíveis publicamente (policy permite `anon` e `authenticated`)

### 12.5 Máquina de Estados do Match

```
                 ┌──────────┐
                 │ proposal │ (criado por user_a)
                 └────┬─────┘
                      │
            ┌─────────┼──────────┐
            ▼                    ▼
      ┌──────────┐        ┌──────────┐
      │ accepted │        │ rejected │ (terminal)
      └────┬─────┘        └──────────┘
           │
    confirmed_by_a +
    confirmed_by_b
           │
           ▼
      ┌───────────┐
      │ completed │ (terminal)
      └───────────┘
```

### 12.6 Labels Padronizados de Status

| Status DB   | Label no App          | Onde aparece                              |
|-------------|-----------------------|-------------------------------------------|
| `proposal`  | Pendente ⏳            | TradeContextCard, Matches (badge)         |
| `accepted`  | Em negociação 🤝      | TradeContextCard, Matches (badge), Chat   |
| `completed` | Troca concluída ✅     | TradeContextCard, Matches (badge)         |
| `rejected`  | Troca não realizada ❌ | TradeContextCard, Chat                    |

### Fluxo de Conclusão de Troca

1. Ambos usuários combinam a entrega via chat
2. Cada um clica em "Confirmar Troca" na tela de Propostas
3. O trigger `check_trade_completion` muda o status para `completed` quando ambos confirmam
4. O trigger `deactivate_items_on_trade_completion` marca os itens como `inactive`
5. A tela permanece aberta mostrando "Troca Concluída" e o dialog de avaliação
6. Uma RLS policy permite que participantes vejam itens inativos envolvidos em seus matches

---

## 13. Realtime e Notificações

### Canais Realtime (Supabase Realtime)

| Canal | Tabela | Evento | Uso |
|-------|--------|--------|-----|
| `messages:{convId}` | messages | INSERT | Nova mensagem no chat |
| `notifications-realtime` | notifications | INSERT | Nova notificação |
| `unread-badge` | messages | INSERT/UPDATE | Badge de não-lidos |

### Triggers de Notificação (SQL)

| Trigger | Tabela | Evento | Ação |
|---------|--------|--------|------|
| `notify_on_match` | matches | INSERT | Notifica user_b sobre nova proposta |
| `notify_on_trade_confirmed` | matches | UPDATE | Notifica ambos quando status → accepted |
| `check_trade_completion` | matches | UPDATE (BEFORE) | Muda status para completed se ambos confirmaram |

Triggers legados duplicados (`on_new_match`, `on_trade_confirmation`) foram removidos; permanecem `on_match_created` e `trg_matches_auto_complete` para evitar notificações/execuções em dobro.

### Indicadores de Leitura no Chat

- **Enviado** (✓): Mensagem inserida no banco
- **Lido** (✓✓): `read_at` preenchido via `markMessagesAsRead()`
- Auto-marcação ao abrir conversa

---

## 14. Storage e Upload de Mídia

### Buckets Supabase Storage

| Bucket | Público | Uso | Validação |
|--------|---------|-----|-----------|
| `avatars` | ✅ | Fotos de perfil | JPG/PNG/WebP, ≤5MB |
| `item-images` | ✅ | Fotos de itens | JPG/PNG/WebP, ≤5MB |
| `item-videos` | ✅ | Vídeos de itens + thumbnails | MP4/WebM, ≤50MB |
| `chat-media` | ✅ | Mídia enviada no chat | Imagem/Vídeo/Áudio |

### Validação de Arquivos (`fileValidation.ts`)

| Tipo | Formatos | Tamanho máximo |
|------|----------|----------------|
| Imagem | JPEG, PNG, WebP | 5 MB |
| Vídeo | MP4, WebM | 50 MB |
| Áudio | WebM, OGG, MPEG/MP3, MP4/M4A/AAC | 10 MB |

> **Áudio no iPhone/Safari:** a gravação do chat detecta suporte do `MediaRecorder` e, em navegadores Apple, prioriza `audio/mp4`/M4A em vez de WebM. A validação normaliza MIME com `codecs` e aceita extensão `.m4a` mesmo quando o Safari omite `file.type`. O `MediaRecorder` é iniciado com `start(100)` para chunks frequentes e, no `stopRecording`, chamamos `requestData()` antes do `stop()` para forçar o flush do último buffer (crítico em mobile). Cada gravação mantém os chunks em escopo local da sessão; `dataavailable` atrasado de gravação antiga é ignorado por `sessionId`, evitando prefixos inválidos antes do cabeçalho WebM/OGG/MP4. Antes do upload validamos tamanho real, duração mínima (400ms) e assinatura do container (`EBML`, `OggS` ou `ftyp`) — não há mais detecção de silêncio por `AnalyserNode`, que gerava falsos positivos. O `AudioPlayer` reseta estado ao trocar o `src`, escuta `canplay` + `error`, tem timeout de segurança de 1.5s no `fixDuration` e tenta recuperar áudios antigos que tenham bytes corrompidos antes do cabeçalho válido.

### Política de Pastas

Os uploads seguem o padrão `{userId}/{itemId}/{filename}` para garantir que o RLS de Storage valide a propriedade via `auth.uid()`.

---

## 15. Edge Functions

### `validate-item-price`
- **Propósito:** Validação de preço com IA
- **Input:** nome, categoria, condição, valor, descrição
- **Output:** `valid`, `reason`, `suggestedMin`, `suggestedMax`
- **Fallback:** Se falhar, permite o item (graceful degradation)

### `admin-stats`
- **Propósito:** KPIs agregados do painel admin
- **Acesso:** Requer role `admin`

### `admin-ai-chat`
- **Propósito:** Assistente IA para administradores
- **Secrets:** `LOVABLE_API_KEY`, `TAVILY_API_KEY`

### `delete-account`
- **Propósito:** Exclusão de conta (LGPD)
- **Acesso:** Autenticado (própria conta)

### `send-auth-email`
- **Propósito:** Enviar emails de autenticação customizados (signup, recuperação de senha, magic link, invite, troca de email)
- **Templates:** `signupTemplate`, `recoveryTemplate`, `magicLinkTemplate`, `emailChangeTemplate`, `inviteTemplate`
- **Design:** Tema escuro Hypou (BG `#1C1C1C`, PRIMARY `#18FDF6`), tipografia Plus Jakarta Sans, bloco de código com token em destaque
- **Nota:** O template de recuperação (`recoveryTemplate`) **não inclui link de fallback** — apenas o código OTP, evitando que links de email abram em browser externo em apps nativos

---

## 16. Painel Administrativo

### Acesso
- Rota: `/admin`
- Guard: `AdminProtectedRoute` (verifica role `admin` via `user_roles`)
- Layout: Sidebar fixa + conteúdo

### Módulos

| Módulo | Descrição |
|--------|-----------|
| **Dashboard** | KPIs (usuários, itens, matches, taxa de conversão) + gráficos Recharts |
| **Usuários** | Lista, busca, visualização de perfis |
| **Itens** | Lista de itens com filtros |
| **Matches** | Visualização de propostas e trocas |
| **Denúncias** | Gestão de reports com resolução |
| **Waitlist** | Lista de espera pré-lançamento + configuração do link do WhatsApp (tabela `site_settings`) |
| **Status** | Incidentes do sistema + uptime checks |
| **Assistente** | Chat com IA para suporte interno |

### Feed de Atividade em Tempo Real
- `RealtimeActivityFeed`: Timeline vertical com eventos recentes
- Subscrição Supabase Realtime em múltiplas tabelas

---

## 17. Segurança (RLS e Políticas)

### Princípios

1. **RLS habilitado em todas as tabelas**
2. **Dados sensíveis isolados**: Perfis completos visíveis apenas ao dono; terceiros acessam via `public_profiles`
3. **RBAC via `has_role()`**: Função `SECURITY DEFINER` evita recursão
4. **Validação de propriedade**: Funções como `is_item_owner()`, `is_match_participant()`, `is_conversation_participant()`
5. **Storage seguro**: Policies validam `auth.uid()` em uploads

### Resumo de Políticas RLS

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| `profiles` | Próprio + Admin | Próprio | Próprio | ❌ |
| `items` | Todos (ativos) + dono | Próprio | Próprio | Próprio |
| `item_images` | Todos | Dono do item | Dono do item | Dono do item |
| `matches` | Participantes | user_a | Participantes | ❌ |
| `conversations` | Participantes | Participantes | ❌ | ❌ |
| `messages` | Participantes | Participantes (sender) | Participantes | ❌ |
| `notifications` | Próprio | ❌ (trigger) | Próprio | Próprio |
| `swipes` | Próprio | Próprio | ❌ | ❌ |
| `favorites` | Próprio | Próprio | ❌ | Próprio |
| `blocked_users` | Próprio | Próprio | ❌ | Próprio |
| `reports` | Próprio + Admin | Próprio | Admin | ❌ |
| `user_roles` | Próprio + Admin | Admin | ❌ | Admin |
| `ratings` | Autenticados | Próprio (rater) | ❌ | Próprio |

### Funções de Segurança (SECURITY DEFINER)

| Função | Uso |
|--------|-----|
| `has_role(uuid, app_role)` | Verifica role sem recursão RLS |
| `is_item_owner(uuid)` | Verifica se auth.uid() é dono do item |
| `is_match_participant(uuid)` | Verifica se auth.uid() é parte do match |
| `is_conversation_participant(uuid)` | Verifica participação na conversa (via match) |

---

## 18. SEO e PWA

### SEO

- **Título:** `Hypou — Troque o que tá parado` (< 60 chars)
- **Meta description:** `Plataforma de trocas inteligentes. Dê match, negocie e troque com segurança.`
- **Open Graph:** Título, descrição, imagem 1200×630
- **Twitter Cards:** `summary_large_image`
- **JSON-LD:** `WebApplication` schema
- **Canonical:** `https://hypou.lovable.app`
- **Robots.txt:** Presente em `/public/robots.txt`
- **Lang:** `pt-BR` no `<html>`

### PWA

- Plugin: `vite-plugin-pwa`
- `apple-mobile-web-app-capable: yes`
- `apple-mobile-web-app-status-bar-style: black-translucent`
- Touch icon configurado

---

## 19. Testes

### Framework
- **Vitest** com `jsdom` como ambiente
- **Testing Library** para testes de componentes

### Suíte de Testes

| Arquivo | Escopo |
|---------|--------|
| `tradeFlow.test.ts` | Transições de estado, detecção de lado A/B, formatação BRL |
| `matchService.test.ts` | Regras de aceitação de proposta, conclusão de troca, badges |
| `searchService.test.ts` | Lógica de busca e filtros |
| `itemService.test.ts` | Serviço de itens |
| `notifications.test.ts` | Notificações |

### Executar Testes
```bash
npx vitest run
```

---

## 20. Glossário

| Termo na UI | Significado Técnico |
|-------------|---------------------|
| **Explorar** | Feed de swipe com itens recomendados |
| **Proposta** | Match com status `proposal` |
| **Partida / Troca** | Match com status `accepted` |
| **Troca concluída** | Match com status `completed` |
| **Swipe** | Gesto de arrastar (like/dislike) |
| **Margem** | % de variação aceita no valor de troca |
| **Shorts** | Feed de vídeos curtos de itens |
| **Favoritos** | Itens salvos para ver depois |
| **Onboarding** | Fluxo inicial de configuração do perfil |

---

> **Nota:** Este documento reflete o estado atual da aplicação em 2026-04-10. Para alterações no banco de dados, consulte `supabase/migrations/`. Para o Design System visual detalhado, consulte `DESIGN_SYSTEM.md`.

---

## 🔧 Build Nativo (Capacitor)

O Hypou usa o **Capacitor** para gerar builds nativos Android e iOS a partir do mesmo codebase React.

### Dependências instaladas

- `@capacitor/core`, `@capacitor/cli`
- `@capacitor/android`, `@capacitor/ios`
- `@capacitor/splash-screen`, `@capacitor/status-bar`, `@capacitor/keyboard`

### Passo a passo para rodar nativamente

1. **Exporte o projeto para GitHub** via botão "Export to Github" no Lovable
2. Clone e instale:
   ```bash
   git clone <SEU_REPO>
   cd hypou
   npm install
   ```
3. **Adicione as plataformas nativas:**
   ```bash
   npx cap add android
   npx cap add ios
   ```
4. **Gere os assets (ícones e splash screen):**
   - Coloque `icon.png` (1024x1024) e `splash.png` (2732x2732) na pasta `resources/`
   ```bash
   npx @capacitor/assets generate --iconBackgroundColor '#0a0a0a' --splashBackgroundColor '#0a0a0a'
   ```
5. **Build e sync:**
   ```bash
   npm run build
   npx cap sync
   ```
6. **Rodar no emulador ou dispositivo:**
   ```bash
   npx cap run android   # Requer Android Studio
   npx cap run ios       # Requer Mac com Xcode
   ```

### Hot Reload (desenvolvimento)

O `capacitor.config.ts` está configurado com `server.url` apontando para o preview do Lovable. Isso permite hot reload direto no dispositivo/emulador durante o desenvolvimento.

**Para produção**, remova ou comente o bloco `server` no `capacitor.config.ts` para que o app use os arquivos locais do `dist/`.

### Requisitos

| Plataforma | Ferramenta | Versão mínima |
|------------|-----------|---------------|
| Android | Android Studio | Arctic Fox+ |
| iOS | Xcode | 14+ |
| iOS | macOS | Ventura+ |

### Referência

- [Documentação Capacitor](https://capacitorjs.com/docs)
- [Lovable + Capacitor](https://docs.lovable.dev/tips-tricks/mobile-development)

---

## Suíte de Testes QA

A suíte de testes do Hypou utiliza **Vitest + jsdom** e cobre lógica pura (helpers, validações, máquinas de estado) sem mocks pesados de Supabase, garantindo execução rápida e estável.

### Arquivos de teste (`src/test/`)
- `auth.test.ts` — validação de e-mail, senha, tradução de erros pt-BR, OAuth redirect.
- `items.test.ts` — formatação de moeda BRL, limites de fotos/vídeo, margens, faixa de troca, filtro de feed.
- `swipeMatch.test.ts` — direção de swipe, reciprocidade, filtros (próprio/bloqueados), compatibilidade.
- `proposals.test.ts` — permissões (user_a/user_b), máquina de estados (proposal→accepted→completed), badges.
- `chatTrade.test.ts` — labels de status (Em negociação / Troca concluída / Troca não realizada), confirmação dupla, desativação automática.
- `ratings.test.ts` — score 1–5, permissão por participante, média.
- `moderation.test.ts` — bloqueios, regras, validação de reports.
- `uiHelpers.test.ts` — date-fns pt-BR, truncamento, localização, skeletons, badges, pull-to-refresh.

### Execução
```bash
npx vitest run
```

Total atual: **48 arquivos / 508 testes**, todos passando.

---

## 21. Melhorias pós-QA (Abr/2026)

A partir do `RELATORIO_TESTES_HYPOU.md`, foram aplicadas as seguintes correções:

- **Suporte a HEIC/HEIF (iPhone)** — `src/lib/fileValidation.ts` aceita `image/heic`/`image/heif` (até 15 MB) e expõe `ensureWebCompatibleImage()` que converte para JPEG via `heic2any` (dynamic import). Aplicado em `uploadItemImage`, `uploadAvatar` e `uploadChatMedia`.
- **Haptics nativos** — `src/lib/haptics.ts` usa `@capacitor/haptics` em iOS/Android nativos e cai para `navigator.vibrate` no web. Aplicado em swipe like e em sucesso/erro de proposta no `Explorar`.
- **Badge numérico no BottomNav** — substitui o dot pulsante; mostra contagem real até "99+" com `aria-label` para acessibilidade.
- **Persistência de proposta pendente** — em `Explorar`, o item curtido fica em `sessionStorage["hypou:pending-like-item"]`; ao retornar de `/novo-item` o `SelectItemDialog` reabre automaticamente.
- **Microcopy melhorada no `SelectItemDialog`** — título "Você curtiu! 🎯 Escolha seu item" reduz ambiguidade.
- **`HypouLogo` semântico** — nova prop `as` permite renderizar como `h1` para SEO em telas-chave.
- **Rate limit no `validate-item-price`** — 5 req/min por token (chave: últimos 32 chars do `Authorization` ou IP), responde HTTP 429 com `Retry-After` para proteger custo de IA.


## Correções pós-QA (2026-04-25)

- `BrowserRouter` agora usa `future={{ v7_startTransition, v7_relativeSplatPath }}`.
- `ProductCardEl` em `Index.tsx` envolvido em `React.forwardRef` (corrige warning).
- `Cadastro` valida TLDs reservados (`.test/.example/.invalid/.localhost`) e traduz erro de rate limit do Supabase Auth.
- `OnboardingTour` carrega imagem com `loading="lazy" decoding="async"`.
- `NotificationBell`: botão "Marcar todas como lidas" explícito (não auto), badge `99+`, agrupamento de >2 propostas pendentes.
- `lib/fileValidation.ts`: novas funções `compressImage` (≤1600px, JPEG q=0.82) e `prepareImageForUpload` (HEIC→JPEG→compress). Aplicado em `itemService.uploadItemImage` e `profileService.uploadAvatar`.
- `Perfil.tsx` (step 1 do onboarding): explica por que pedimos localização.
- Cobertura: 520 testes (49 suítes), incluindo `src/test/e2e/22-correcoes-qa.test.ts` para regressão das correções.


## 22. Landing Page de Download (`/baixar`) — Mai/2026

Nova rota pública dedicada à conversão para as lojas de aplicativo.

- **Rota**: `/baixar` (lazy, pública). A rota `/` continua sendo o entry do app (criar conta / entrar).
- **Página**: `src/pages/Baixar.tsx` — hero, "Como funciona", contador de stats, diferenciais e CTA final.
- **Componentes**: `src/components/landing/{StoreBadge,HowItWorks,Differentials,StatsCounter,LandingFooter}.tsx`.
- **Config**: `src/config/storeLinks.ts` exporta `APP_STORE_URL`, `PLAY_STORE_URL` (placeholders `#` até a publicação) e `detectPlatform()` (iOS / Android / desktop).
- **UX/UI**: identidade Liquid Glass mantida — gradient mesh cyan/purple, `glass-card`, Plus Jakarta Sans, Lucide icons, tom de voz Hypou/Troca.
- **Framer Motion**: parallax do mockup com `useScroll`/`useTransform`, stagger `whileInView`, microinterações `whileHover`/`whileTap` nas badges, contador animado (`animate` + `useMotionValue`), respeita `prefers-reduced-motion`.
- **Plataforma-aware**: destaca App Store em iOS/desktop e Play Store em Android. Em desktop, exibe QR code (gerado via `api.qrserver.com`) apontando para `/baixar`.
- **SEO**: `<title>` e `<meta name="description">` setados via `useEffect`, H1 com keyword "Hypou".


## Realtime Sync (2026-05-08)

Substituído modelo de "recarregar a página" por sincronização em tempo real via Supabase Realtime.

- **Tabelas adicionadas à publicação `supabase_realtime`**: `notifications`, `conversations`, `ratings`, `items`, `item_images`, `item_videos`, `profiles`, `blocked_users` (já existiam: `matches`, `match_items`, `messages`). Todas com `REPLICA IDENTITY FULL` para payloads completos em UPDATE/DELETE.
- **Hook genérico `useRealtimeInvalidate(subs, enabled)`** em `src/hooks/useRealtimeInvalidate.ts` — recebe lista de `{ table, filter?, event?, invalidateKeys }` e invalida queries do React Query quando rows mudam. Cleanup automático no unmount, canal único por hook.
- **Aplicado em**:
  - `useMatches` / `useMatch` — propostas e status atualizam sem reload (recebimento, aceite, conclusão, cancelamento).
  - `useProfile` — perfil, lista de itens, contagem de propostas/trocas e rating médio sincronizam ao vivo.
  - `useConversations` — nova conversa criada (proposta aceita) aparece imediatamente.
  - `useNotifications` — já existia, mantido.
  - `useMessages` — já existia via `subscribeToMessages`.
- **Padrão**: hooks de dados invalidam queryKeys; componentes apenas consomem `useQuery`. Filtros usam sintaxe Postgres (`user_id=eq.${uid}`) para reduzir tráfego.

## Deep link de item compartilhado (rota /item/:itemId)
- Nova rota pública `src/pages/Item.tsx` exibe um anúncio específico (imagens, preço, descrição, dono e CTAs) acessível sem login.
- `SwipeCard` agora compartilha `${origin}/item/${item.id}` em vez de `/explorar`, levando quem recebe direto ao anúncio.
- Usa `public.items` (RLS permite leitura de itens `status='active'`) e `public_profiles` para dados do dono.
- CTA inferior leva usuários logados ao `/explorar` e não-logados ao `/cadastro`.

## SwipeToggle — iconografia da marca (Explorar)
- Substituídos os chevrons neutros e os ícones genéricos X/check do `src/components/SwipeToggle.tsx` por ícones Lucide alinhados à voz da marca.
- Estado neutro: knob limpo, sem indicadores direcionais.
- Arraste à esquerda (Flopou): ícone `Repeat` em `hsl(var(--danger))`.
- Arraste à direita (Hypou): ícone `Handshake` em `hsl(var(--success))`.
- Lógica de drag, thresholds e callbacks `onSwipe` permanecem inalterados.

## Hardening de segurança (RLS, triggers, edge function)
- **matches** — trigger `trg_matches_update_guard` impede alterar identidade (`user_a_id`, `user_b_id`, `item_a_id`, `item_b_id`, `created_at`), só o participante correspondente pode mudar seu próprio `confirmed_by_*`, status `completed` exige ambas confirmações e estados terminais (`completed`/`cancelled`) são imutáveis. Trigger `trg_matches_auto_complete` faz a transição para `completed` automaticamente ao confirmar dos dois lados. Política UPDATE com `WITH CHECK` espelhando o `USING`.
- **messages** — trigger `trg_messages_update_guard` torna `id`, `conversation_id`, `sender_id` e `created_at` imutáveis; apenas o remetente pode editar `content`, `media_url`, `message_type`; apenas o destinatário pode mexer em `read_at`. Política UPDATE com `WITH CHECK`.
- **profiles** — trigger `trg_profiles_update_guard` bloqueia alteração de `subscription_tier` e `subscription_expires_at` pelo próprio usuário (admins fazem bypass via `has_role`). Política UPDATE com `WITH CHECK`.
- **ratings** — adicionada política UPDATE explícita: `USING/WITH CHECK (auth.uid() = rater_id)`.
- **storage.objects** — adicionadas políticas UPDATE em `chat-media` e `item-videos` restritas ao dono do path (`(storage.foldername(name))[1] = auth.uid()`).
- **edge function `validate-item-price`** — exige `Authorization: Bearer <jwt>` válido (via `supabase.auth.getClaims`), retorna 401 sem token e usa o `userId` autenticado como chave do rate limit (5 req/min), eliminando o drain anônimo da API.

## SwipeCard — Anatomia (atualizado)

Refatorado em subcomponentes (pasta `src/components/SwipeCard/`):

- **`SwipeCard.tsx`** (orquestrador) — gestos, motion values (`x`, `rotate`, `liftScale`), galeria, expanded panel, mini-perfil do dono.
- **`SwipeCard/SwipeOverlays.tsx`** — glow nas bordas + stamps "HYPOU"/"FLOPOU" reagindo ao drag. Usa tokens `--hype` / `--flop`.
- **`SwipeCard/SwipeActionButtons.tsx`** — botões Hypou (👍 verde) / Flopou (👎 vermelho) com cores e glows derivados do drag via `useTransform`. Usa tokens `--hype`, `--hype-glow`, `--flop`, `--flop-glow`, `--glass-surface`.
- **`SwipeCard/CardDetailContent.tsx`** — conteúdo do painel expandido (preço, descrição, trade range, perfil do anunciante).

Estrutura em duas zonas:
- **Imagem**: `object-cover object-center` preenche a área visível.
- **Pedestal Liquid Glass** (bottom): tags → título → preço → "Ver detalhes" → botões Hypou/Flopou centralizados.

## Botões Hypou / Flopou (Explorar)

- Tamanho: 64×64, `rounded-full`, `glass-button`.
- **Estado idle**: fundo `--glass-surface`, ícone tintado (Flopou → `--flop`, Hypou → `--hype-glow`).
- **Drag para esquerda** (Flopou): botão escala 1.18×, fundo interpola para `--flop`, ícone vira `--flop-foreground`, halo `shadow-glow-flop`.
- **Drag para direita** (Hypou): mesma lógica espelhada com `--hype` / `--hype-glow`.
- Toda a interpolação de cor usa tokens via `hsl(var(--token))` — zero cor hardcoded.

## Chrome do card

- Top gradient: `h-20 from-black/40 via-black/15 to-transparent` (apenas legibilidade do chrome).
- Owner chip: rating com 1 decimal (`5.0`).
- Dots de paginação: container `bg-scrim/30 backdrop-blur-xl` para contraste em qualquer foto.

## Conversa — Anatomia (atualizado)

Refatorado em subcomponentes (pasta `src/pages/Conversa/`) — `Conversa.tsx` reduzido de 691 → 302 linhas (apenas orquestração de estado e data-fetching):

- **`Conversa.tsx`** — hooks (`useMessages`, `useConversationDetails`, `useSendMessage`, `useUploadChatMedia`), state e handlers (`handleSend`, `handleReport`, `handleBlock`, gravação de áudio com fallback iPhone/Safari para M4A, chamadas).
- **`Conversa/ChatHeader.tsx`** — back, avatar/nome do outro, ícone par de itens, botões `Phone`/`Video`, menu Denunciar/Bloquear.
- **`Conversa/MessageList.tsx`** — render de mensagens (text/image/video/audio/system) com check/checkcheck. `forwardRef` para o scroll auto.
- **`Conversa/MessageInput.tsx`** — textarea, menu de anexos, indicador de gravação/upload, botão enviar (gradiente primary→roxo).
- **`Conversa/ReportDialogs.tsx`** — Dialog de denúncia (motivos chips + descrição) + AlertDialog de confirmação de bloqueio.
- **Confirmação de troca in-chat** (29/05/2026): quando `match.status === "accepted"`, o chat exibe abaixo do `TradeContextCard` o botão "Já troquei, confirmar entrega" (ou "Concluir troca" se o outro lado já confirmou). Abre `AlertDialog` e chama `confirmTrade()`. Quando o usuário já confirmou, mostra "Você confirmou — aguardando o outro lado". Ao concluir (ambos confirmados), abre automaticamente o `RatingDialog`. `useConversationDetails` agora retorna `my_confirmed`/`other_confirmed`.


## Vídeo & Áudio Chamada no Chat (LiveKit)

Adicionado em 14/05/2026.

**Stack**: LiveKit Cloud (SFU gerenciado, free 10k min/mês) + `livekit-client` + `@livekit/components-react`.

**Banco**:
- Tabela `call_sessions` (conversation_id, caller_id, callee_id, kind, status, room_name, accepted_at, ended_at, duration_seconds).
- RLS: apenas participantes; trigger guarda transições (callee aceita/recusa).
- Trigger AFTER UPDATE injeta mensagem de sistema no chat ao encerrar (com duração).
- Tabela em `supabase_realtime` publication.
- UNIQUE parcial impede duas chamadas ativas na mesma conversa.

**Edge function** `livekit-token`: valida JWT, valida participação, cria/lê `call_sessions`, assina `AccessToken` LiveKit (TTL 1h) com grants `roomJoin/canPublish/canSubscribe`. Secrets: `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL`.

**Frontend**:
- `src/services/callService.ts` — start/join/accept/decline/end/missed.
- `src/hooks/useIncomingCalls.ts` — assina realtime de `call_sessions` p/ callee.
- `src/components/IncomingCallSheet.tsx` — overlay topo Liquid Glass (montado 1× no `App.tsx`).
- `src/pages/Chamada.tsx` — rota `/chamada/:roomName` (lazy). `LiveKitRoom` full-screen, vídeo remoto cobrindo, self-view PiP, controles (mic, cam, switch camera, hangup). Caller faz markMissed após 45s sem resposta.
- `src/pages/Conversa.tsx` — botões `Phone` e `Video` no header.

**Capacitor**: WebView moderno (iOS 14.5+ / Android atual) já suporta WebRTC sem plugin extra. v1 funciona apenas com app aberto; CallKit/lockscreen fica para v2.

---

## Zero-Reload Realtime Sync (2026-05)

Toda a UI atualiza ao vivo. Nunca é preciso recarregar a página para ver: novo item próprio, proposta, mensagem, chamada perdida, favorito, bloqueado, vídeo ou item no Explorar/Busca.

**Camadas:**

1. **`src/lib/realtimeManager.ts`** — `forceReconnect()` derruba e religa o WebSocket Supabase Realtime (debounce 2s). Os canais já assinados via `supabase.channel()` reassinam sozinhos.
2. **`src/hooks/useAppLifecycleSync.ts`** — montado em `<GlobalAlerts/>` (App.tsx). Escuta `visibilitychange`, `window.focus`, `window.online` e `@capacitor/app` `appStateChange`. Em qualquer "voltei ativo" chama `forceReconnect()` + `queryClient.invalidateQueries()`.
3. **QueryClient defaults** (`App.tsx`): `refetchOnWindowFocus: true`, `refetchOnReconnect: 'always'`, `refetchOnMount: true`, `staleTime: 30s`, `gcTime: 30min`.
4. **`useRealtimeInvalidate`** cobre: profiles, items, item_images, matches, match_items, messages, conversations, notifications, ratings, call_sessions (entrada e perdidas), favorites, blocked_users, item_videos, video_likes (Shorts), items (Busca/Explorar).
5. **Publication `supabase_realtime`** inclui agora também `favorites`, `swipes`, `user_categories`, `video_likes`, `site_settings` (REPLICA IDENTITY FULL).
6. Removido `refetchInterval: 30000` de `useConversations` — confiamos no realtime + lifecycle sync.

**Dependência nova:** `@capacitor/app` (lifecycle no nativo).


## Update 2026-05-26 — Reset de senha
- Tratamento amigável de erros do supabase.auth.updateUser em ResetPassword.tsx (PT-BR): senha igual à anterior, senha curta, rate limit.
- LOGO_URL dos templates de e-mail (send-auth-email/_templates.ts) atualizado para https://hypou.lovable.app/logo-hypou.png (domínio publicado real).


## Update 2026-05-26 — Otimização de imagens
- src/lib/imageUrl.ts (cdnFull/cdnMedium/cdnThumb/cdnBlur) reescreve URLs públicas do Supabase Storage para /storage/v1/render/image/public/ com width+quality. Sem backfill no bucket: o CDN serve variantes recomprimidas on-the-fly.
- Aplicado em SwipeCard (fullscreen+blur+thumb), Item, Match, Matches, ItemPreviewDialog, SelectItemDialog, TradeContextCard, Explorar prefetch.

