

# Plano: Refinamento do Frontend Admin

## Problema

O painel admin tem bordas brancas/claras visíveis em vários elementos (sidebar, header, chat area, inputs, separadores), criando um visual "quadriculado" e pouco profissional no modo escuro. O layout precisa parecer mais limpo e integrado.

## Mudanças

### 1. Reduzir opacidade das bordas globais (src/index.css)

- Mudar `--border` no dark mode de `0 0% 100% / 0.12` para `0 0% 100% / 0.06` — corta pela metade a visibilidade de todas as bordas
- Mudar `--sidebar-border` de `0 0% 100% / 0.1` para `0 0% 100% / 0.06`
- Mudar `--input` de `0 0% 100% / 0.12` para `0 0% 100% / 0.08`

### 2. Limpar sidebar (AdminSidebar.tsx)

- Remover `border-r border-border/50` da Sidebar — usar apenas diferença de fundo como separador
- Remover os dois `<Separator>` que criam linhas horizontais desnecessárias
- Reduzir `ring-2 ring-primary/20` do avatar para `ring-1 ring-border`

### 3. Limpar header do layout (AdminLayout.tsx)

- Trocar `border-b border-border/50` por `border-b border-transparent dark:border-white/[0.04]` — borda quase invisível
- Remover `ring-2 ring-border` do avatar do header

### 4. Limpar área de chat (AdminAssistente.tsx)

- Remover `border border-border/50` do container do chat — deixar só o fundo diferenciado
- Remover `border-t border-border/50` do input area — usar apenas espaçamento
- Reduzir `border border-border/50` dos suggestion cards para `border border-white/[0.04]`

### 5. Suavizar glass-card e glass-panel no dark (src/index.css)

- `.dark .glass-card` border: mudar de `rgba(255, 255, 255, 0.05)` para `rgba(255, 255, 255, 0.03)`
- `.dark .glass-panel` border: mudar de `hsl(0 0% 100% / 0.08)` para `hsl(0 0% 100% / 0.04)`

## Resultado esperado

Painel admin com visual mais limpo e integrado — sem linhas brancas visíveis contornando cada elemento, mantendo hierarquia visual apenas por diferença de fundo e espaçamento.

## Arquivos editados

1. `src/index.css` — tokens de borda + glass utilities
2. `src/components/admin/AdminSidebar.tsx` — remover bordas e separadores
3. `src/pages/admin/AdminLayout.tsx` — suavizar header
4. `src/pages/admin/AdminAssistente.tsx` — limpar chat container

