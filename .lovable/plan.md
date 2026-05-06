## Problema

Hoje, quando os dois usuários clicam em "Confirmar entrega":

- O trigger `check_trade_completion` muda o `matches.status` para `completed` e o trigger `deactivate_items_on_trade_completion` desativa `item_a` e `item_b`.
- **Porém**: nada é enviado no chat da troca concluída, e os outros usuários que estavam negociando esses mesmos itens (em outros `matches` com status `accepted`/`proposal`) continuam com chat ativo, podendo seguir conversando sobre um item que já não existe mais.

## Solução

1. **Mensagem automática "sistema" no chat da troca concluída.**
2. **Cancelar todos os outros matches abertos que envolvem `item_a_id` ou `item_b_id`** e inserir mensagem automática nos chats deles avisando que o item ficou indisponível.
3. **Travar a UI do chat** (esconder input + mostrar banner) quando o match estiver `completed` ou `cancelled`.

## Mudanças

### 1. Banco (migração)

- Criar função `handle_trade_completion()` (SECURITY DEFINER) chamada via trigger `AFTER UPDATE ON matches` quando `status` muda para `completed`:
  - Insere mensagem do tipo `system` na `conversation` deste match: "✅ Troca concluída! Avalie seu trocador."
  - Faz `UPDATE matches SET status = 'cancelled'` em todos os outros matches em que `item_a_id` ou `item_b_id` apareça (exceto o atual) e que estejam em `proposal` ou `accepted`.
  - Para cada match cancelado que tenha `conversation`, insere mensagem `system`: "⚠️ Item indisponível — o(s) outro(s) trocador(es) finalizaram uma troca com este item. Conversa encerrada."
- Garantir que `messages.message_type` aceite `'system'` (coluna é `text` livre, então só precisamos usar o valor).
- Para a inserção de mensagens via trigger funcionar com RLS, usar `SECURITY DEFINER` e setar `sender_id = NULL` não é viável (NOT NULL). Alternativa: usar o `user_a_id` do match como `sender_id` mas marcar `message_type = 'system'` (a UI ignora o sender em mensagens system). A função roda como definer e ignora RLS.

### 2. Frontend

**`src/services/messageService.ts`**
- Adicionar `'system'` ao tipo `MessageType`.

**`src/pages/Conversa.tsx`**
- Renderizar mensagens com `message_type === 'system'` como banner centralizado (sem avatar/bolha), estilo `bg-foreground/5 text-muted-foreground rounded-full text-xs px-4 py-2 mx-auto`.
- Quando `details.match_status === 'completed'` ou `'cancelled'`: ocultar a área de input e mostrar barra fixa: "Esta conversa foi encerrada" (com link para avaliação se completed).
- Atualizar `matchStatusLabel` para incluir `completed` ("Troca concluída ✅") e `cancelled` ("Conversa encerrada 🔒").

**`src/services/messageService.ts` (getConversations)** já retorna `match_status`; nada a alterar lá.

### 3. Realtime

O canal de `messages` já está inscrito por `conversation_id`, então a mensagem `system` inserida pelo trigger chega em tempo real para os outros usuários. O `match_status` é refetched ao receber nova mensagem? — adicionar invalidação de `["conversation-detail", conversationId]` em `Conversa.tsx` no callback de realtime para que o input seja travado imediatamente quando chegar a mensagem do sistema.

## Detalhes técnicos

- Trigger único `AFTER UPDATE ON matches` com `WHEN (OLD.status IS DISTINCT FROM 'completed' AND NEW.status = 'completed')`.
- Função usa CTE para identificar matches a cancelar:
  ```sql
  UPDATE matches SET status='cancelled', updated_at=now()
  WHERE id <> NEW.id
    AND status IN ('proposal','accepted')
    AND (item_a_id IN (NEW.item_a_id, NEW.item_b_id)
      OR item_b_id IN (NEW.item_a_id, NEW.item_b_id))
  RETURNING id;
  ```
- Para cada um, inserir uma mensagem system na conversation correspondente (se existir).
- Ordem dos triggers: o `deactivate_items_on_trade_completion` continua atuando antes (BEFORE UPDATE) — não conflita.
