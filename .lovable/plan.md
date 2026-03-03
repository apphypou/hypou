

## Plano: Modelo C com Popup de Selecao de Item no Like

### Resumo do Fluxo

```text
1. Usuario A ve item do Usuario B na Explorar → swipa LIKE
2. POPUP aparece: "Qual dos seus itens voce quer oferecer?"
   → Lista os itens ativos do Usuario A com foto, nome e valor
   → Usuario A seleciona 1 item → confirma
3. Proposta criada no banco (status='proposal', com item_a e item_b definidos)
   → Notificacao para Usuario B: "Alguem quer trocar pelo seu [item]!"
4. Usuario B abre tela Propostas
   → Ve apenas os itens que Usuario A selecionou (nao todos)
   → Aceita ou rejeita
5. Ao aceitar → Match confirmado → Chat criado → Ambos notificados
```

### Mudancas no Banco de Dados

**1. Alterar o trigger `check_for_match()`**
- Remover a logica de match automatico por like mutuo
- O trigger passa a nao criar matches -- apenas registra o swipe normalmente

**2. Nova tabela `proposals`** (ou reutilizar `matches` com status `proposal`)
- Reutilizar a tabela `matches` e mais simples. Adicionar status `proposal` ao fluxo:
  - `proposal` → pendente de aceite do dono
  - `accepted` → match confirmado
  - `rejected` → recusado
- O campo `item_a_id` sera o item do Usuario A (quem deu like/selecionou)
- O campo `item_b_id` sera o item do Usuario B (o item que recebeu o like)
- Nenhuma alteracao de schema necessaria -- os campos e status ja existem

**3. Novo insert de match via cliente (nao mais via trigger)**
- Apos o usuario selecionar seu item no popup, o frontend insere diretamente na tabela `matches` com `status: 'proposal'`
- Precisa adicionar RLS policy de INSERT na tabela `matches`

**4. Atualizar trigger `notify_on_match()`**
- Mudar a mensagem para "Alguem quer trocar pelo seu [item]!" em vez de "Novo Match!"
- Notificar apenas o dono do item (user_b), nao ambos

### Mudancas no Frontend

**1. Novo componente `SelectItemDialog`** (~novo arquivo)
- Dialog/Drawer (mobile-first) que aparece apos o like
- Busca os itens ativos do usuario logado (`items` where `user_id = current_user`)
- Exibe lista com foto, nome e valor de cada item
- Botao "Confirmar" cria a proposta
- Se usuario nao tem itens: mostra CTA "Cadastre seu primeiro item"

**2. Modificar `Explorar.tsx`**
- Ao dar like, em vez de chamar `createSwipe` + checar match automatico:
  - Abrir o `SelectItemDialog` passando o item curtido
  - No callback de confirmacao: criar swipe + inserir match com status `proposal`
- Se o usuario cancelar o popup: nao registrar o swipe (ou registrar como dislike)

**3. Modificar `Matches.tsx` (tela Propostas)**
- Diferenciar visualmente propostas recebidas vs enviadas
- Para propostas recebidas (status `proposal`): mostrar botoes Aceitar/Rejeitar
- Para propostas enviadas: mostrar status "Aguardando resposta"
- Ao aceitar: update status para `accepted`, criar conversa, notificar

**4. Modificar `matchService.ts`**
- Nova funcao `createProposal(userId, myItemId, theirItemId)` que insere na tabela matches
- Ajustar `getMatches` para incluir status `proposal` na query

**5. Atualizar `swipeService.ts`**
- O swipe continua sendo registrado (para evitar ver o mesmo item de novo)
- Mas nao depende mais do trigger para criar match

**6. Modificar notificacoes**
- Trigger `notify_on_match`: notificar so o dono ao receber proposta
- Trigger `notify_on_trade_confirmed`: manter para quando aceitar

### Ordem de Implementacao

1. Migration: adicionar RLS INSERT policy na tabela `matches` + desativar/modificar trigger `check_for_match`
2. Criar componente `SelectItemDialog`
3. Modificar `Explorar.tsx` para usar o dialog
4. Atualizar `matchService.ts` com `createProposal`
5. Atualizar `Matches.tsx` para diferenciar propostas recebidas/enviadas
6. Atualizar triggers de notificacao
7. Testar fluxo completo

