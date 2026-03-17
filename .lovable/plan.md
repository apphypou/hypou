

## Analise Arquitetural — Fluxo Proposta → Match → Chat

Depois de rastrear o fluxo completo de ponta a ponta, encontrei problemas estruturais importantes que precisam ser corrigidos.

---

### Bug Critico 1: Chat lista propostas sem conversa

Em `messageService.ts` linha 108:
```text
id: convId || m.id
```

Quando um match nao tem conversa (status `proposal`), `convId` e `undefined`, entao o codigo usa `m.id` (o match_id) como se fosse conversation_id. O filtro na linha 122 (`.filter(c => c.id)`) sempre passa porque `m.id` e truthy.

**Resultado**: Propostas pendentes e recusadas aparecem na lista de conversas do Chat.tsx. Ao clicar, o usuario vai para `/chat/{match_id}` onde o Conversa.tsx tenta buscar mensagens usando um match_id como conversation_id — nao encontra nada e mostra uma tela vazia/quebrada.

**Fix**: Filtrar apenas matches que possuem conversa real (`convId` existente).

---

### Bug Critico 2: Botoes de aceitar/recusar no Conversa.tsx sao codigo morto

O Conversa.tsx (linhas 349-367) tem botoes "Aceitar Troca" e "Recusar" que aparecem quando `match_status === "proposal"`. Porem, conversas so sao criadas quando a proposta e aceita (`acceptProposal` cria a row na tabela `conversations`). Entao um usuario nunca chegara ao Conversa.tsx com status "proposal" — esses botoes sao codigo morto.

**Fix**: Remover esses botoes do Conversa.tsx. A acao de aceitar/recusar deve acontecer exclusivamente no Matches.tsx.

---

### Bug 3: acceptProposal pode criar conversas duplicadas

Se `acceptProposal` for chamado duas vezes (double-click, retry), ele cria duas rows na tabela `conversations` para o mesmo `match_id`. Nao ha unique constraint em `conversations.match_id`.

**Fix**: Adicionar `UNIQUE(match_id)` na tabela `conversations` via migration.

---

### Bug 4: Qualquer participante pode aceitar proposta

O `acceptProposal` nao verifica se quem esta aceitando e o user_b (dono do item alvo). O user_a (quem enviou) tambem consegue aceitar sua propria proposta porque a RLS permite UPDATE para ambos participantes.

**Fix**: Adicionar verificacao no `acceptProposal` que confirma `user_b_id === currentUserId`, ou adicionar uma RLS policy mais restritiva para UPDATE de status.

---

### Bug 5: Sem validacao de status antes de aceitar/recusar

`acceptProposal` e `rejectProposal` nao verificam se o match ainda esta em status "proposal". Uma proposta ja aceita pode ser aceita novamente (criando outra conversa duplicada) ou rejeitada depois de aceita.

**Fix**: Adicionar `.eq("status", "proposal")` nos queries de update e verificar se alguma row foi atualizada.

---

### Performance: getConversations busca TODAS as mensagens

Na linha 80-96 do `messageService.ts`, a funcao busca TODAS as mensagens de TODAS as conversas para encontrar a ultima. Com muitas conversas e mensagens, isso se torna muito lento e pode atingir o limite de 1000 rows do Supabase.

**Fix**: Para cada conversa, buscar apenas a ultima mensagem com `LIMIT 1`, ou usar uma abordagem com subquery/RPC.

---

## Plano de Implementacao

### 1. Corrigir filtro de conversas no messageService
- Em `getConversations`, filtrar apenas matches que possuem `convId` real (excluir matches sem conversa)

### 2. Remover botoes mortos do Conversa.tsx
- Remover o bloco de accept/reject (linhas 349-367) ja que o usuario nunca chega la com status "proposal"

### 3. Migration: UNIQUE constraint em conversations.match_id
- `ALTER TABLE conversations ADD CONSTRAINT conversations_match_id_unique UNIQUE (match_id);`

### 4. Validar status antes de aceitar/recusar
- Em `acceptProposal` e `rejectProposal`, adicionar `.eq("status", "proposal")` e verificar se a operacao atualizou alguma row

### 5. Validar que apenas user_b pode aceitar
- Em `acceptProposal`, buscar o match primeiro e comparar `user_b_id` com o usuario logado antes de atualizar

### 6. Otimizar busca de ultima mensagem
- Refatorar para buscar apenas 1 mensagem por conversa em vez de todas

Total: 6 correcoes cirurgicas que garantem a integridade do fluxo proposta → match → chat.

