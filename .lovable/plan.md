

# Hypou -- Plano de Arquitetura Backend Completo

## Resumo Executivo

Este plano conecta todas as telas existentes do Hypou a um backend Supabase escalavel, preparado para SaaS (free/premium), com schema relacional, RLS rigoroso, logica de match e roadmap sequencial de execucao.

---

## PASSO 1 -- Analise da UI (Dados Mapeados)

Abaixo, cada tela e os dados que ela consome ou produz:

| Tela | Dados de Leitura | Dados de Escrita |
|------|------------------|------------------|
| **Index** (Landing) | Nenhum | Nenhum |
| **Login** | -- | `auth.signInWithPassword` |
| **Cadastro** | -- | `auth.signUp` + profile auto-criado |
| **Onboarding (Perfil)** | -- | Step 1: `profiles.display_name`, `profiles.location`, `profiles.avatar_url` / Step 2: categorias de interesse do usuario / Step 3: item (nome, valor, descricao, fotos) / Step 4: margem de troca (valorizacao %, desvalorizacao %) |
| **Explorar** | Items de outros usuarios (foto, nome, categoria, localizacao, valor, qtd fotos) | Swipes (like/dislike/superlike no item) |
| **Matches (Propostas)** | Lista de matches mutuos (item, dono, badge, valor, online status) | -- |
| **Match (Confirmacao)** | Dados do match (2 itens, 2 usuarios) | -- |
| **MeuPerfil** | Profile do usuario, stats (trocas, rating, propostas), lista de itens proprios | -- |
| **Chat** (futuro, no BottomNav) | Conversas e mensagens | Envio de mensagens |

---

## PASSO 2 -- Schema do Banco de Dados (PostgreSQL)

### 2.1 Tabela `profiles` (ja existe -- sera expandida)

Campos novos a adicionar:

```text
subscription_tier   TEXT NOT NULL DEFAULT 'free'    -- 'free' | 'premium'
subscription_expires_at  TIMESTAMPTZ              -- null = sem assinatura ativa
onboarding_completed  BOOLEAN NOT NULL DEFAULT false
phone               TEXT
```

### 2.2 Tabela `user_categories` (interesses do Step 2)

```text
id           UUID PK DEFAULT gen_random_uuid()
user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
category     TEXT NOT NULL   -- 'Celulares', 'Carros & Motos', etc.
created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
UNIQUE(user_id, category)
```

### 2.3 Tabela `items` (bens para troca)

```text
id              UUID PK DEFAULT gen_random_uuid()
user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
name            TEXT NOT NULL
description     TEXT
category        TEXT NOT NULL
market_value    INTEGER NOT NULL DEFAULT 0     -- valor em centavos (R$)
condition       TEXT DEFAULT 'used'            -- 'new' | 'like_new' | 'used' | 'worn'
location        TEXT
margin_up       INTEGER NOT NULL DEFAULT 15    -- % acima que aceita
margin_down     INTEGER NOT NULL DEFAULT 10    -- % abaixo que aceita
status          TEXT NOT NULL DEFAULT 'active' -- 'active' | 'paused' | 'traded'
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

### 2.4 Tabela `item_images` (fotos dos itens, ate 5)

```text
id           UUID PK DEFAULT gen_random_uuid()
item_id      UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE
image_url    TEXT NOT NULL
position     INTEGER NOT NULL DEFAULT 0   -- ordem da foto
created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
```

### 2.5 Tabela `swipes` (acoes de explorar)

```text
id           UUID PK DEFAULT gen_random_uuid()
swiper_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
item_id      UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE
direction    TEXT NOT NULL   -- 'like' | 'dislike' | 'superlike'
created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
UNIQUE(swiper_id, item_id)
```

### 2.6 Tabela `matches` (quando ha interesse mutuo)

```text
id             UUID PK DEFAULT gen_random_uuid()
item_a_id      UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE
item_b_id      UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE
user_a_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
user_b_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
status         TEXT NOT NULL DEFAULT 'pending'  -- 'pending' | 'accepted' | 'declined' | 'completed'
created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
```

### 2.7 Tabela `conversations` (ligada ao match)

```text
id           UUID PK DEFAULT gen_random_uuid()
match_id     UUID NOT NULL UNIQUE REFERENCES matches(id) ON DELETE CASCADE
created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
```

### 2.8 Tabela `messages`

```text
id              UUID PK DEFAULT gen_random_uuid()
conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE
sender_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
content         TEXT NOT NULL
read_at         TIMESTAMPTZ
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

### 2.9 Diagrama Relacional

```text
auth.users
    |
    +--< profiles (1:1, user_id)
    |
    +--< user_categories (1:N, user_id)
    |
    +--< items (1:N, user_id)
    |       |
    |       +--< item_images (1:N, item_id)
    |       |
    |       +--< swipes (N:1, item_id)
    |       |
    |       +--< matches (via item_a_id / item_b_id)
    |
    +--< swipes (1:N, swiper_id)
    |
    +--< matches (via user_a_id / user_b_id)
    |       |
    |       +-- conversations (1:1, match_id)
    |               |
    |               +--< messages (1:N, conversation_id)
```

### 2.10 Storage Bucket

- Bucket `item-images` (publico para leitura, upload restrito ao dono)
- Bucket `avatars` (publico para leitura, upload restrito ao dono)

---

## PASSO 3 -- Regras de Seguranca (RLS)

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| `profiles` | Todos autenticados | Proprio user_id | Proprio user_id | -- |
| `user_categories` | Proprio user_id | Proprio user_id | -- | Proprio user_id |
| `items` | Todos autenticados (status='active') | Proprio user_id | Proprio user_id | Proprio user_id |
| `item_images` | Todos autenticados | Dono do item | Dono do item | Dono do item |
| `swipes` | Proprio swiper_id | Proprio swiper_id | -- | -- |
| `matches` | Participante (user_a ou user_b) | Via funcao server-side | Participante | -- |
| `conversations` | Participante do match | Via funcao server-side | -- | -- |
| `messages` | Participante da conversa | Participante da conversa (sender = auth.uid) | -- | -- |

Para `item_images`, `matches` e `conversations`, funcoes `SECURITY DEFINER` serao usadas para verificar ownership sem recursao RLS.

---

## PASSO 4 -- Algoritmo de Match

A logica de match executa via funcao PostgreSQL (SECURITY DEFINER), chamada automaticamente apos cada INSERT na tabela `swipes`:

```text
1. Usuario A da "like" no Item X (dono: Usuario B)
2. Trigger dispara funcao check_for_match()
3. A funcao verifica:
   a. Existe algum swipe de B com direction='like' em algum item de A?
   b. Se SIM:
      - Verifica compatibilidade de margem de valor entre os itens
      - Cria registro em `matches` (item_a = item de A, item_b = Item X)
      - Cria registro em `conversations`
      - Retorna match_id (frontend redireciona para tela Match)
   c. Se NAO: nada acontece
```

A verificacao de margem funciona assim:
- Item A vale R$5.000 (margin_up: 15%, margin_down: 10%) = aceita de R$4.500 a R$5.750
- Item B vale R$5.500 (margin_up: 20%, margin_down: 15%) = aceita de R$4.675 a R$6.600
- Se ambos os ranges se sobrepoem, o match e compativel

---

## PASSO 5 -- Estrutura de Integracao Front/Back

Em vez de Zustand (mencionado no contexto mas nao implementado), o projeto ja usa **React Query** (`@tanstack/react-query`), que e a abordagem ideal. A estrutura sera:

### Camada de Servicos (`src/services/`)

```text
src/services/
  profileService.ts    -- CRUD de profiles
  itemService.ts       -- CRUD de items + images
  swipeService.ts      -- createSwipe (retorna match ou null)
  matchService.ts      -- listMatches, getMatch
  messageService.ts    -- listMessages, sendMessage (+ Realtime)
```

### Camada de Hooks (`src/hooks/`)

```text
src/hooks/
  useProfile.ts        -- useQuery + useMutation para profile
  useItems.ts          -- useQuery para items do feed, useMutation para CRUD
  useSwipe.ts          -- useMutation que retorna match_id se houver match
  useMatches.ts        -- useQuery para listar matches
  useMessages.ts       -- useQuery + Supabase Realtime subscription
```

### Fluxo de Dados

```text
Componente UI
    |
    v
Custom Hook (useItems, useSwipe, etc.)
    |
    v
React Query (cache, refetch, optimistic updates)
    |
    v
Service Layer (supabase.from('items').select(...))
    |
    v
Supabase Client --> PostgreSQL + RLS
```

O Supabase Realtime sera usado em:
- **Messages**: subscription no canal da conversa para mensagens em tempo real
- **Matches**: subscription para notificar novo match instantaneamente

---

## PASSO 6 -- Roadmap de Execucao Sequencial

### Etapa 1: Schema Base + Storage
- Migracoes SQL: expandir `profiles`, criar `user_categories`, `items`, `item_images`
- Criar buckets `item-images` e `avatars` no Supabase Storage
- RLS para todas as tabelas criadas

### Etapa 2: Onboarding Funcional
- Conectar Step 1 (perfil) ao `profiles` real (upload avatar + save name/location)
- Conectar Step 2 ao `user_categories`
- Conectar Step 3 ao `items` + `item_images` (upload fotos)
- Conectar Step 4 ao `items.margin_up` / `items.margin_down`
- Marcar `onboarding_completed = true` ao finalizar

### Etapa 3: Feed de Explorar + Swipe
- Service + hook para buscar items de outros usuarios (excluindo proprios e ja swipados)
- Conectar botoes X / Zap / Heart aos swipes ('dislike' / 'superlike' / 'like')
- Implementar animacao de swipe com gestos (Framer Motion -- dependencia a instalar)

### Etapa 4: Sistema de Match
- Funcao PostgreSQL `check_for_match()` + trigger no INSERT de swipes
- Criar `matches` e `conversations` automaticamente
- Tela de confirmacao de match consumindo dados reais
- Notificacao de novo match

### Etapa 5: Tela de Propostas (Matches)
- Hook `useMatches` para listar matches do usuario
- Conectar tela Matches aos dados reais (substituir mock data)
- Filtros e badges dinamicos

### Etapa 6: Chat em Tempo Real
- Criar tela de Chat (ainda nao existe no front)
- Criar tela de Conversa individual
- `useMessages` com Supabase Realtime para mensagens instantaneas
- Indicador de "online" e "lido"

### Etapa 7: Perfil Completo
- Conectar MeuPerfil aos dados reais (profile, items, stats)
- Stats calculados: total de trocas, rating medio, total de propostas
- Edicao de perfil e itens

### Etapa 8: Preparacao SaaS
- Integracao com Stripe para assinaturas (Edge Function)
- Limites por tier: usuarios free veem X swipes/dia, premium ilimitado
- Campo `subscription_tier` ja estara no banco desde a Etapa 1

### Etapa 9: Rotas Protegidas + Polish
- Middleware de autenticacao (redireciona para /login se nao logado)
- Redirecionar para /onboarding se `onboarding_completed = false`
- Tela de recuperacao de senha
- Tratamento de erros e loading states em todas as telas

---

## Notas Tecnicas Importantes

1. **Valores monetarios**: armazenados em centavos (INTEGER) para evitar problemas de ponto flutuante
2. **Subscription tier**: armazenado em `profiles` como TEXT simples, nao em tabela separada de roles (roles de admin sim, seguirao o padrao `user_roles` com enum)
3. **Sem Zustand**: o projeto ja usa React Query, que cobre cache, revalidacao e estado do servidor. Estado local (formularios) continua com useState
4. **Framer Motion**: sera adicionada como dependencia na Etapa 3 para animacoes de swipe
5. **Supabase Realtime**: ativado para `messages` e `matches` para experiencia instantanea

