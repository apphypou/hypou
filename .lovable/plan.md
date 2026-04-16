
# Plano: Status de troca no chat, desativação de itens e feedback obrigatório

## Resumo
Implementar lógica completa de ciclo de vida da troca: status visível no chat, desativar itens ao concluir, e prompt automático de avaliação para ambos os usuários.

## O que muda

### 1. Status da troca no TradeContextCard (chat)
Atualizar `TradeContextCard.tsx` para exibir 3 status claros:
- **"Em negociação"** (status `accepted`) — substituindo "Aceita"
- **"Troca concluída"** (status `completed`)
- **"Troca não realizada"** (status `rejected`)

### 2. Desativar itens quando a troca é concluída
Criar um **database trigger** na tabela `matches` que, ao detectar `status = 'completed'`, automaticamente atualiza `items.status = 'inactive'` para `item_a_id` e `item_b_id`. Isso faz os itens sumirem do feed de ambos os usuários.

**Migration SQL:**
```sql
CREATE OR REPLACE FUNCTION public.deactivate_items_on_trade_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    UPDATE items SET status = 'inactive' WHERE id IN (NEW.item_a_id, NEW.item_b_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_trade_completed_deactivate_items
  AFTER UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION deactivate_items_on_trade_completion();
```

### 3. Prompt de avaliação automático para ambos
Na página **Matches** (`Matches.tsx`): quando o usuário abre um match com status `completed` e ainda não avaliou (`useMatchRating`), abrir automaticamente o `RatingDialog`.

Também exibir botão "Avaliar troca" nos matches concluídos que ainda não foram avaliados.

### 4. Avaliação visível no perfil público
O `PerfilUsuario.tsx` já usa `useUserRating` para exibir média e contagem. Verificar e garantir que a seção de rating está visível (já implementado).

### 5. Rating público (SELECT para anon)
Atualmente ratings tem SELECT apenas para `authenticated`. Adicionar policy para `anon` poder ver ratings, para visitantes verem a reputação.

**Migration SQL adicional:**
```sql
DROP POLICY IF EXISTS "Authenticated users can view ratings" ON public.ratings;
CREATE POLICY "Anyone can view ratings" ON public.ratings
  FOR SELECT TO anon, authenticated USING (true);
```

### 6. Atualizar documentacao.md
Documentar o trigger de desativação e o fluxo de feedback.

## Arquivos modificados
- `src/components/TradeContextCard.tsx` — novos labels de status
- `src/pages/Matches.tsx` — auto-abrir RatingDialog em completed, botão avaliar
- `supabase/migrations/` — trigger deactivate_items + policy ratings
- `documentacao.md` — documentar mudanças

## Detalhes técnicos
- O trigger `check_trade_completion` já muda status para `completed` quando ambos confirmam
- O novo trigger `deactivate_items_on_trade_completion` roda AFTER UPDATE, após o status já ter sido atualizado
- Itens inativos já são filtrados do feed pelo RLS (`status = 'active'`)
- O `RatingDialog` já existe e funciona, só precisa ser aberto automaticamente
