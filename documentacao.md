# 📘 Hypou — Documentação Técnica Completa

> **Versão:** 1.0 · **Última atualização:** 2026-04-10
> **URL de produção:** https://hypou.lovable.app

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
├── pages/
│   ├── Index.tsx             # Landing page
│   ├── Login.tsx             # Tela de login
│   ├── Cadastro.tsx          # Tela de registro
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
| `/login` | `Login` | Autenticação |
| `/cadastro` | `Cadastro` | Registro de conta |
| `/recuperar-senha` | `RecuperarSenha` | Esqueci minha senha |
| `/reset-password` | `ResetPassword` | Redefinir senha (via link) |
| `/termos` | `Termos` | Termos de uso |
| `/privacidade` | `Privacidade` | Política de privacidade |
| `/explorar` | `Explorar` | Feed público (modo visitante) |

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

### 6.4 Efeitos Visuais (Utilitários CSS)

| Classe | Descrição |
|--------|-----------|
| `.glass-panel` | Fundo sólido com sombra suave (light) / fundo translúcido (dark) |
| `.glass-card` | Card com `backdrop-blur(12px)`, borda ultra-sutil no dark |
| `.neon-glow` | Box-shadow com cor primary a 30% opacidade |
| `.text-glow` | Text-shadow ciano (apenas no dark mode) |
| `.gradient-text` | Texto com gradiente foreground → primary |
| `.no-scrollbar` | Oculta scrollbar (webkit + Firefox) |
| `.animate-float` | Animação flutuante (6s infinite) |

### 6.5 Responsividade

- **Mobile-first** (viewport principal: 390×844 CSS px)
- `viewport-fit=cover` para suporte a notch/safe-areas
- `env(safe-area-inset-*)` usado em headers e botões fixos
- Container Tailwind: `max-w-2xl: 1400px`, centralizado

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
- **Recuperação de senha:** Magic link via email
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
| `getRecommendedItems()` | Itens recomendados via RPC `recommended_items` |
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

### 12.4 Fluxo de Conclusão da Troca

```
Match aceito → Chat liberado (/chat/:conversationId)
             → Usuários combinam entrega
             → Cada um confirma: confirmTrade()
                → confirmed_by_a = true / confirmed_by_b = true
             → Trigger check_trade_completion():
                → Se ambos confirmaram + status = "accepted"
                → status = "completed"
             → Tela de avaliação (RatingDialog)
```

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
| Áudio | WebM, OGG, MPEG | 10 MB |

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
| **Waitlist** | Lista de espera pré-lançamento |
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
