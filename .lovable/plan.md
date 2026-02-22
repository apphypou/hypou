
# Plano de Transformacao: Prototipo para Produto Real

## Resumo da Auditoria

Apos analise completa de todas as telas e servicos, o codigo ja esta **bem conectado ao Supabase** com dados reais. Nao existe Zustand - o projeto usa React Query + services, que e a arquitetura correta. No entanto, existem pontos especificos que precisam ser corrigidos.

## Problemas Encontrados

### 1. Botoes Inativos (sem onClick)

| Tela | Botao | Problema |
|------|-------|----------|
| MeuPerfil | Settings (engrenagem) | Sem `onClick`, nao faz nada |
| Matches | SlidersHorizontal (filtro) | Sem `onClick`, nao faz nada |
| Matches | Search (busca) | Sem `onClick`, nao faz nada |
| Matches | MessageSquare (chat no card) | Sem `onClick`, nao navega para conversa |
| Explorar | SlidersHorizontal (filtro) | Sem `onClick`, nao faz nada |
| Index | Globe (idioma) | Sem `onClick`, nao faz nada |
| Index | "Termos de Uso" / "Politica de Privacidade" | Links com `href="#"` |

### 2. Placeholder de Rating

- Em `useProfile.ts`, o rating e hardcoded como `4.9` com comentario "placeholder until rating system is implemented"

### 3. Telas Faltantes

- **Configuracoes**: botao existe em MeuPerfil mas nao ha rota/tela
- **Adicionar Item (standalone)**: o botao "Novo Item" navega para `/perfil` (onboarding inteiro), quando deveria abrir apenas o formulario de item

### 4. Botao "Novo Item" redireciona para onboarding

- O botao em MeuPerfil navega para `/perfil` que e o fluxo de onboarding completo (4 steps). Deveria abrir um formulario dedicado de cadastro de item.

### 5. Matches - Botao de chat no card nao funciona

- O botao `MessageSquare` no card de match (linha 125 de Matches.tsx) nao tem `onClick` para navegar para a conversa.

## Plano de Implementacao

### Task 1: Criar tela de Configuracoes (/configuracoes)

Criar uma tela simples seguindo o Design System com opcoes basicas:
- Sair da conta (logout)
- Sobre o app
- Versao do app
- Link para o botao de Settings em MeuPerfil

### Task 2: Criar tela dedicada de Cadastro de Item (/novo-item)

Extrair a logica do Step 3 de Perfil.tsx para uma pagina standalone `/novo-item` que:
- Permite cadastrar nome, descricao, categoria, valor, fotos
- Permite definir margens de valorizacao/desvalorizacao
- Salva no Supabase (items + item_images)
- Redireciona para MeuPerfil ao concluir
- O botao "Novo Item" em MeuPerfil navega para `/novo-item`

### Task 3: Corrigir botoes inativos em Matches

- Adicionar `onClick` no botao MessageSquare do card para navegar para a conversa do match
- Remover ou implementar filtro/busca (filtro pode abrir um Sheet com opcoes de status)

### Task 4: Remover/desativar botoes sem funcionalidade definida

- Explorar: botao de filtro - pode ser removido ou implementar filtro por categoria
- Index: botao Globe - remover (nao ha i18n)
- Index: links "Termos de Uso" e "Politica de Privacidade" - apontar para paginas placeholder ou remover `href="#"`

### Task 5: Substituir rating placeholder

- Enquanto nao existe sistema de rating, exibir "--" ao inves de `4.9` para nao enganar o usuario
- Remover o destaque visual do rating card ate que seja implementado

### Task 6: Conectar botao Settings em MeuPerfil

- Adicionar `onClick={() => navigate("/configuracoes")}` no IconButton de Settings

### Task 7: Adicionar rota /novo-item e /configuracoes no App.tsx

- Ambas protegidas com `ProtectedRoute`

---

## Detalhes Tecnicos

### Arquivos a criar:
- `src/pages/Configuracoes.tsx` - tela de configuracoes
- `src/pages/NovoItem.tsx` - formulario standalone de cadastro de item

### Arquivos a editar:
- `src/App.tsx` - adicionar rotas `/configuracoes` e `/novo-item`
- `src/pages/MeuPerfil.tsx` - conectar botao Settings, mudar navegacao "Novo Item" para `/novo-item`
- `src/pages/Matches.tsx` - adicionar onClick no botao de chat, remover botoes inativos ou implementar filtro basico
- `src/pages/Explorar.tsx` - remover ou implementar botao de filtro
- `src/pages/Index.tsx` - remover botao Globe, corrigir links do footer
- `src/hooks/useProfile.ts` - substituir rating `4.9` por `null` ou `0`

### Padrao de codigo:
- Manter Clean Architecture (pages -> hooks -> services -> supabase)
- Loading states com `Loader2` animado (cor primary)
- Skeleton loading para conteudo de perfil
- Tom de voz democratico: "Propor Troca", "Cadastrar Item", "Configuracoes"
