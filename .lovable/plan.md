

# Plano: Correção completa do fluxo de conclusão de troca

## Problemas identificados

### Bug 1: Histórico mostra tela em branco
Quando a troca é concluída, o trigger `deactivate_items_on_trade_completion` marca ambos os itens como `inactive`. A política RLS da tabela `items` permite ver apenas itens `active` ou itens do próprio usuário (`auth.uid() = user_id`). Resultado: ao abrir uma troca concluída no histórico, o item do outro usuário retorna `null` e a condição `otherItem && myItem` (linha 318 de `Matches.tsx`) falha, mostrando tela em branco.

### Bug 2: Tela de conclusão nunca aparece
Após clicar "Confirmar Troca", o `handleConfirmTrade` executa `setSelectedMatch(null)` (linha 92), fechando o popup imediatamente. O usuário nunca vê o estado "Troca Concluída" nem o dialog de avaliação.

### Bug 3: Rating dialog nunca abre automaticamente
O auto-open (linha 48-53) depende de `selectedMatch?.status === "completed"`, mas como o popup fecha após confirmar, `selectedMatch` é `null` e o dialog nunca aparece.

## Correções

### 1. Permitir visualização de itens em matches concluídos (Migration)
Criar uma nova política RLS na tabela `items` que permita participantes de um match visualizar os itens envolvidos, independente do status do item.

```sql
CREATE POLICY "Match participants can view traded items"
ON public.items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.matches
    WHERE (matches.item_a_id = items.id OR matches.item_b_id = items.id)
    AND (matches.user_a_id = auth.uid() OR matches.user_b_id = auth.uid())
  )
);
```

**Arquivo:** Nova migration SQL

### 2. Manter popup aberto após confirmar troca
Em `Matches.tsx`, alterar `handleConfirmTrade` para **re-buscar os dados do match** ao invés de fechar o popup. Se o match retornar como `completed`, manter aberto para mostrar a tela de conclusão e o rating dialog.

```
- Remover `setSelectedMatch(null)` do handleConfirmTrade
- Após invalidar queries, re-fetch o match atualizado
- Atualizar selectedMatch com os novos dados (status pode ter mudado para completed)
```

**Arquivo:** `src/pages/Matches.tsx` (handleConfirmTrade, ~linhas 85-98)

### 3. Melhorar tela de troca concluída no popup
Quando `selectedMatch.status === "completed"`, exibir uma seção celebratória antes dos botões de ação, com destaque visual claro de que a troca foi finalizada com sucesso.

**Arquivo:** `src/pages/Matches.tsx` (seção de bottom actions, ~linhas 481-496)

### 4. Garantir rating dialog funcional
Remover a dependência do `useEffect` auto-open e acionar o rating dialog diretamente quando o match transiciona para `completed` dentro do `handleConfirmTrade`. Manter também o auto-open para quando o usuário abre um match completed pelo histórico.

**Arquivo:** `src/pages/Matches.tsx`

### 5. Atualizar documentacao.md
Documentar o fluxo corrigido de conclusão de troca.

## Arquivos modificados
- `supabase/migrations/` — nova RLS policy para items em matches
- `src/pages/Matches.tsx` — handleConfirmTrade, tela de conclusão, rating dialog
- `documentacao.md` — documentar correções

