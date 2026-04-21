

# Plano: Bolinha de mensagens no navbar + Correção de status no chat

## Resumo
Dois ajustes: garantir que a bolinha de mensagens não lidas apareça de forma confiável no BottomNav, e remover código legado que pode causar inconsistência no status exibido no chat.

## 1. Bolinha de mensagens não lidas no navbar

O código já existe em `BottomNav.tsx` e `useUnreadCount.ts` com assinatura realtime. Porém, a bolinha atual (8px) pode não estar visível dependendo do posicionamento. Ajustes:

- **Aumentar a bolinha** de `h-2 w-2` para `h-2.5 w-2.5` e adicionar borda para contraste
- **Adicionar animação pulse** para chamar atenção quando há mensagens novas
- **Reposicionar** a bolinha para ficar mais visível (top-right do ícone)

**Arquivo:** `src/components/BottomNav.tsx`

## 2. Bug do status "Aceita" vs "Em negociação"

O `TradeContextCard` já foi atualizado para mostrar "Em negociação 🤝" para status `accepted`. Porém, em `Conversa.tsx` (linha 278) existe uma variável `matchStatusLabel` que mapeia `accepted` → "Troca aceita ✅". Embora essa variável pareça não estar sendo renderizada atualmente, ela representa código inconsistente que deve ser removido ou alinhado.

Além disso, na página `Matches.tsx` (linha 108), o badge mostra "Aceita" para status `accepted`. Isso deve ser atualizado para "Em negociação" para manter consistência em todo o app.

**Arquivos:**
- `src/pages/Conversa.tsx` — alinhar `matchStatusLabel` com os mesmos termos do `TradeContextCard`
- `src/pages/Matches.tsx` — alterar badge "Aceita" → "Em negociação"

## 3. Atualizar documentacao.md

Documentar os status padronizados de troca usados em todo o app.

## Arquivos modificados
- `src/components/BottomNav.tsx` — bolinha maior com pulse
- `src/pages/Conversa.tsx` — alinhar labels de status
- `src/pages/Matches.tsx` — badge "Aceita" → "Em negociação"
- `documentacao.md` — documentar padronização

