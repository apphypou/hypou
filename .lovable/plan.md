# Proposta múltipla: até 3 itens em uma troca

Hoje uma proposta tem 1 item de cada lado (`matches.item_a_id` ↔ `matches.item_b_id`). Vamos permitir que o **lado proponente** combine **até 3 itens próprios** para chegar no valor do item desejado do outro trocador.

Exemplo: oferecer Carro (R$50k) + Relógio (R$50k) + Relógio (R$50k) = R$150k para trocar pela Casa de R$150k.

## Decisões de produto

- Limite: **1 a 3 itens próprios** por proposta. O outro lado continua oferecendo **1 item** (o que recebeu o like).
- Faixa de troca: a soma dos valores dos itens propostos deve cair dentro do `margin_down`/`margin_up` do item desejado. Se ficar fora, mostramos aviso mas permitimos enviar (dono decide).
- Ao aceitar, **todos** os itens do lote ficam reservados: ao concluir a troca, todos viram `inactive` e qualquer outra proposta envolvendo qualquer um deles é cancelada (já existe lógica para 2 itens — vamos estender).
- Cancelar/rejeitar uma proposta libera os itens normalmente.

## Mudanças de banco

Nova tabela `match_items` (junção) — preserva `matches.item_a_id`/`item_b_id` como o item "principal" de cada lado para compatibilidade com tudo que já existe:

```text
match_items
  id uuid pk
  match_id uuid -> matches.id
  user_id  uuid           (dono dos itens, == user_a_id ou user_b_id)
  item_id  uuid -> items.id
  side     text 'a' | 'b'
  created_at
  UNIQUE (match_id, item_id)
```

- RLS: SELECT/INSERT permitido a participantes do match (via `is_match_participant`). UPDATE/DELETE bloqueados.
- Backfill: para cada match existente, inserir 2 linhas (item_a/side=a, item_b/side=b).
- Trigger `enforce_match_items_limit`: ao inserir, BEFORE INSERT, contar linhas existentes para `(match_id, side)` e rejeitar se passar de 3 (lado a) ou 1 (lado b).
- Atualizar trigger `handle_trade_completion`: ao virar `completed`, marcar como `inactive` **todos** os `item_id` em `match_items` daquele match (não só `item_a_id`/`item_b_id`) e cancelar outras propostas abertas que envolvam qualquer um desses itens.
- Atualizar `recommended_items` para considerar também combinações até 3 itens do usuário caindo na faixa do candidato (opcional, fase 2 — não bloqueia o MVP).

## Mudanças de frontend

### 1. `SelectItemDialog` → multi-seleção (até 3)

- State `selectedIds: string[]` em vez de `selectedId`.
- Cada card vira togglable; mostra checkmark e ordem (1/2/3).
- Rodapé fixo com:
  - Soma dos valores selecionados (`R$ XXX`).
  - Valor do item alvo + chip "Dentro da faixa" / "Acima" / "Abaixo" baseado em `margin_down`/`margin_up`.
  - Botão "Propor troca (N item(ns))" — desabilitado se 0 ou >3.
- Botão "+" para cadastrar novo item segue funcionando.
- `onConfirm(myItemIds: string[])`.

### 2. `services/matchService.ts`

- `createProposal(userId, myItemIds: string[], theirItemId, theirUserId)`:
  - Insere em `matches` com `item_a_id = myItemIds[0]` (compat).
  - Insere N linhas em `match_items` com `side='a'` para os IDs do proponente + 1 linha `side='b'` para o item do outro.
  - Tudo numa Edge Function `create-proposal` para garantir atomicidade e validar (≤3, todos ativos, todos do user, não bloqueado).
- `MatchWithDetails` ganha `items_a: Item[]` e `items_b: Item[]` (carregadas via `match_items` join). UI usa array; quando length===1 renderiza igual a hoje.

### 3. UI de exibição da proposta

- `Matches.tsx`, `Match.tsx` (detalhe), `TradeContextCard`, `Conversa.tsx`:
  - Quando `items_a.length > 1`, mostrar mini-galeria horizontal "3 itens · R$ 150.000" com thumbnails empilhados; tocar abre lista.
  - Resumo no topo: `[A] 3 itens (R$150k) ↔ [B] Casa (R$150k)`.
- `RatingDialog` e fluxo de confirmação continuam por `match_id` (sem mudança).

### 4. Faixa de troca / validação

- Helper `isWithinTradeRange(sumA, valueB, marginDown, marginUp)` reutilizável.
- No `SelectItemDialog`, badge dinâmico. Se fora da faixa: toast informativo mas permite enviar.

## Detalhes técnicos

- Tipos TS atualizados via supabase types após migração (automático).
- Edge function `create-proposal` (service role) faz: validação de propriedade dos itens, status active, limite 3, não bloqueado, insere `matches` + `match_items` em uma transação (RPC SQL).
- Alternativa sem edge function: criar RPC `create_proposal(p_my_item_ids uuid[], p_their_item_id uuid)` com `SECURITY DEFINER` validando `auth.uid()`. **Preferida** — menos código e atômica.
- `getMatches` faz um segundo select em `match_items` agrupado por `match_id` e popula `items_a`/`items_b`.
- Realtime: incluir `match_items` na publicação `supabase_realtime` para atualizações ao vivo (opcional).

## Arquivos afetados

- nova migração SQL (tabela + RLS + trigger + RPC + backfill + ajuste no trigger de completion)
- `src/components/SelectItemDialog.tsx`
- `src/services/matchService.ts`
- `src/pages/Explorar.tsx` (passa array para createProposal)
- `src/pages/Matches.tsx`, `src/pages/Match.tsx`, `src/components/TradeContextCard.tsx`, `src/pages/Conversa.tsx`
- `src/lib/utils.ts` (helper de faixa)
- `documentacao.md` (atualização da arquitetura)

## Fora de escopo (fase 2)

- Permitir que o **lado B** também combine múltiplos itens (contraproposta multi).
- Recomendações considerando combinações multi-item.
- Edição da composição da proposta após criada (hoje: cancelar e refazer).
