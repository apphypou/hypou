

# Painel Administrativo Hypou — Plano de Arquitetura

## Visao Geral

Um painel admin completo acessivel via `/admin`, protegido por roles (tabela `user_roles`), com dashboard de monitoracao em tempo real, gestao de usuarios, itens, matches, waitlist e moderacao.

## 1. Modulos Necessarios

### 1.1 Dashboard Principal (Monitoracao em Tempo Real)
- **KPIs em cards**: total de usuarios, itens ativos, matches do dia, taxa de conversao, usuarios online
- **Graficos (Recharts)**: cadastros por dia (ultimos 30d), matches por dia, itens por categoria (pizza), crescimento da waitlist
- **Feed de atividade em tempo real**: novos cadastros, novos matches, novos itens, novas mensagens — via Supabase Realtime (subscribe em `profiles`, `matches`, `items`, `messages`)
- **Metricas de engajamento**: swipes/dia, mensagens/dia, tempo medio de resposta no chat

### 1.2 Gestao de Usuarios
- Tabela com lista de usuarios (nome, email via auth admin, localizacao, data de cadastro, status)
- Detalhes do usuario: itens, matches, avaliacoes, reports
- Acoes: bloquear/desbloquear, ver atividade

### 1.3 Gestao de Itens
- Tabela com todos os itens (nome, categoria, valor, status, dono)
- Filtros por categoria, status, faixa de valor
- Acoes: desativar item, ver detalhes

### 1.4 Gestao de Matches/Propostas
- Lista de matches com status (pending, accepted, rejected)
- Metricas: taxa de aceitacao, tempo medio de resposta

### 1.5 Moderacao
- Reports pendentes com detalhes
- Acoes: resolver report, bloquear usuario reportado
- Fila de moderacao com prioridade

### 1.6 Waitlist
- Total de inscritos, crescimento diario
- Tabela com emails, posicao, referral code, data
- Exportar CSV

### 1.7 Configuracoes do Sistema
- Parametros globais (raio de busca padrao, limites)
- Gestao de categorias

## 2. Arquitetura Tecnica

### 2.1 Autenticacao Admin (Seguranca)

**Tabela `user_roles`** seguindo o padrao do sistema:

```sql
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Funcao security definer para checar role
CREATE FUNCTION public.has_role(_user_id uuid, _role app_role) ...
```

### 2.2 Estrutura de Arquivos

```text
src/
├── pages/
│   └── admin/
│       ├── AdminDashboard.tsx      ← Dashboard com KPIs e graficos
│       ├── AdminUsuarios.tsx       ← Gestao de usuarios
│       ├── AdminItens.tsx          ← Gestao de itens
│       ├── AdminMatches.tsx        ← Gestao de matches
│       ├── AdminReports.tsx        ← Moderacao
│       ├── AdminWaitlist.tsx       ← Gestao da waitlist
│       └── AdminLayout.tsx         ← Layout com sidebar
├── components/admin/
│       ├── AdminSidebar.tsx        ← Sidebar com navegacao
│       ├── AdminProtectedRoute.tsx ← Guard que verifica role admin
│       ├── RealtimeActivityFeed.tsx← Feed de atividade ao vivo
│       ├── KpiCard.tsx             ← Card de metrica
│       └── AdminDataTable.tsx      ← Tabela reutilizavel com paginacao
├── hooks/
│       ├── useAdminStats.ts        ← Query de estatisticas agregadas
│       └── useRealtimeActivity.ts  ← Subscribe Realtime para feed
```

### 2.3 Rotas

```text
/admin              → Dashboard
/admin/usuarios     → Gestao de usuarios
/admin/itens        → Gestao de itens
/admin/matches      → Matches e propostas
/admin/reports      → Moderacao
/admin/waitlist     → Lista de espera
```

Todas protegidas por `AdminProtectedRoute` que verifica `has_role(uid, 'admin')`.

### 2.4 Monitoracao em Tempo Real (Detalhe)

- **Supabase Realtime channels** em `profiles`, `items`, `matches`, `messages` para o feed de atividade
- **Polling a cada 30s** para KPIs agregados (COUNT queries via edge function com service role)
- **Edge Function `admin-stats`**: retorna contagens agregadas (usa service role key para bypassar RLS)
- **Graficos com Recharts** (ja disponivel no projeto via `chart.tsx`)

### 2.5 Edge Function para Dados Admin

Uma edge function `admin-stats` que valida JWT + role admin e retorna:
- Total usuarios, itens ativos, matches, mensagens
- Dados agrupados por dia para graficos
- Reports pendentes count

Necessaria porque RLS nao permite SELECT global para dados de outros usuarios.

## 3. Ordem de Implementacao

1. Migration: criar `user_roles` + `has_role()` + atribuir role admin ao seu usuario
2. `AdminProtectedRoute` + `AdminLayout` com sidebar
3. Edge function `admin-stats`
4. Dashboard com KPIs + graficos
5. Feed de atividade em tempo real
6. Paginas de gestao (usuarios, itens, matches, reports, waitlist)

## 4. Stack

- **UI**: Shadcn components existentes (Table, Card, Tabs, Badge, Button) + Recharts (Chart)
- **Layout**: Sidebar desktop com `SidebarProvider` do shadcn
- **Realtime**: `supabase.channel().on('postgres_changes', ...)` 
- **Seguranca**: role check via security definer function, edge function com service role

