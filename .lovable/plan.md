

# Redesign Estetico do Painel Admin Hypou

## Diagnostico Atual

O painel esta funcional mas visualmente generico — cards sem hierarquia visual, sidebar basica, header plano, tabelas sem polish, graficos sem refinamento. Falta identidade visual alinhada com a marca Hypou.

## Mudancas Propostas

### 1. Sidebar Premium
**Arquivo**: `AdminSidebar.tsx`
- Fundo com gradiente sutil (de sidebar-background para um tom levemente mais escuro)
- Logo Hypou centralizada no topo com separador elegante abaixo
- Menu items com border-radius maior (rounded-xl), transicao suave, e indicador lateral ciano (barra de 3px na esquerda) no item ativo em vez de apenas bg-primary/10
- Icones com tamanho levemente maior (h-5 w-5) e spacing refinado
- Hover com efeito de glow sutil no modo escuro
- Footer com avatar do admin + nome truncado ao lado do botao sair

### 2. Header Contextual
**Arquivo**: `AdminLayout.tsx`
- Remover texto generico "Painel Administrativo"
- Adicionar breadcrumb dinamico baseado na rota atual (ex: "Admin / Dashboard")
- Adicionar avatar do usuario logado + nome no canto direito do header
- Adicionar toggle de tema (light/dark) no header
- Background com `backdrop-blur-lg` e borda inferior mais sutil

### 3. KPI Cards Redesign
**Arquivo**: `KpiCard.tsx`
- Cada card com gradiente de fundo unico e sutil baseado na cor semantica do KPI (azul para usuarios, verde para itens, amber para matches, etc.)
- Icone dentro de circulo com gradiente (nao apenas bg-primary/10 para todos)
- Adicionar indicador de trend (seta para cima/baixo com cor verde/vermelho) usando a prop `trend` que ja existe mas nao e usada
- Tipografia do valor com `tabular-nums` para alinhamento numerico
- Hover com leve elevacao (shadow transition)

### 4. Graficos com Mais Polish
**Arquivo**: `AdminDashboard.tsx`
- Cards de graficos com header mais elaborado: icone + titulo + badge com periodo
- Gradientes nos fills dos graficos (linearGradient SVG em vez de cor solida com opacity)
- Grid lines mais sutis (stroke-dasharray, cor muted)
- Tooltips customizados com border-radius maior e sombra
- Pie chart como donut (innerRadius) com label central mostrando total

### 5. Tabelas Refinadas
**Arquivos**: `AdminUsuarios.tsx`, `AdminItens.tsx`, `AdminMatches.tsx`, `AdminReports.tsx`, `AdminWaitlist.tsx`
- Header da tabela com bg-muted/30 e texto uppercase tracking-wider
- Rows com hover mais pronunciado e transicao suave
- Avatares maiores (h-10 w-10) com ring de borda sutil
- Badges com cores semanticas mais vibrantes e rounded-full
- Adicionar barra de busca/filtro no topo de cada tabela (input com icone Search)
- Empty state com ilustracao (icone grande + texto) em vez de tabela vazia

### 6. Feed de Atividade
**Arquivo**: `RealtimeActivityFeed.tsx`
- Timeline vertical com linha conectora entre eventos (border-l)
- Icones de evento dentro de circulos com borda, posicionados sobre a linha
- Animacao de entrada (fade-in slide-up) para novos eventos
- Separacao visual por "agora", "5 min atras", "1h atras" com headers de tempo

### 7. Espacamento e Hierarquia Global
**Arquivo**: `AdminDashboard.tsx` + `AdminLayout.tsx`
- Secoes do dashboard com titulos de secao (ex: "Visao Geral", "Atividade", "Graficos") com icone e linha separadora
- Main area com max-width para nao esticar demais em telas largas (max-w-7xl mx-auto)
- Gap entre secoes aumentado para 8 (space-y-8)
- Background do main area levemente diferente do sidebar (bg-muted/20 ou padrao sutil)

## Detalhes Tecnicos

- **Arquivos editados**: `AdminLayout.tsx`, `AdminSidebar.tsx`, `KpiCard.tsx`, `AdminDashboard.tsx`, `RealtimeActivityFeed.tsx`, `AdminUsuarios.tsx`, `AdminItens.tsx`, `AdminMatches.tsx`, `AdminReports.tsx`, `AdminWaitlist.tsx`
- **Nenhuma dependencia nova** — tudo com Tailwind, shadcn e Recharts existentes
- **Cores**: usar variantes com opacidade dos tokens existentes (primary, accent, success, destructive) + cores semanticas pontuais (blue-500, amber-500, etc.)
- **Animacoes**: transicoes CSS (transition-all duration-200) + framer-motion apenas no feed de atividade
- **Responsivo**: manter mobile-friendly, sidebar collapsa normalmente

