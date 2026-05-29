# Auditoria Profunda de Bugs — Hypou

## Objetivo
Produzir **um único arquivo** `AUDITORIA_BUGS.md` em `/dev-server/` com inventário detalhado de falhas de lógica de negócio, brechas de segurança, race conditions, validações ausentes e fluxos quebrados. **Nenhum arquivo de código será alterado.**

## Escopo da revisão

### 1. Autenticação & contas
- Cadastro/login (e-mail+senha, Google, Apple), recuperação de senha, `/reset-password`
- `onboarding_completed` guard, sessões expiradas, refresh tokens
- Edge function `delete-account` e cascata de dados
- Acesso público (`/explorar`) vs `GuestPromptDialog`

### 2. Itens & cadastro
- `NovoItem` / `EditarItem`: validações, upload de fotos/vídeo, limites de tamanho, idempotência (já corrigida) e retry
- `validate-item-price` (Gemini/Tavily): fail-open, abuso, custo
- RLS de `items`, `item_images`, `item_videos`
- Status `active`/`inactive` e ciclo de vida após troca concluída

### 3. Swipe & recomendação
- RPC `recommended_items`, filtros (bloqueados, já swiped, sem foto)
- Threshold de swipe, loop epoch, feed finito, race em likes rápidos
- `GuestPromptDialog` em ações de swipe

### 4. Match / Propostas
- RPC `create_proposal` (limite 3 itens, valor mínimo, item próprio, bloqueio)
- Triggers `enforce_matches_update_guard`, `check_trade_completion`, `handle_trade_completion`, `deactivate_items_on_trade_completion`
- Aceitar/recusar/cancelar (apenas papéis corretos), transições terminais
- Confirmação dupla in-chat × tela de Trocas, duplicidade de propostas
- 4 abas (Recebidas/Enviadas/Canceladas/Concluídas) — consistência de filtros e contagens

### 5. Chat & mídia
- `is_conversation_participant`, mensagens de sistema, `enforce_messages_update_guard`
- Áudio (bug recente de "vazio"), upload de imagem/vídeo, tamanho
- `TradeContextCard` e estado vs `matches.status`
- Acesso a chat só com `accepted` — verificar bypass via URL `/conversa/:id`

### 6. Chamadas (LiveKit)
- `call_sessions` triggers, status `ringing/accepted/declined/missed/ended`
- `IncomingCallSheet`, race entre múltiplas calls, token edge function

### 7. Avaliações & dupla confirmação
- `ratings` RLS, prevenção de auto-rating, edição/duplicidade
- Trigger `check_trade_completion` requer ambos `confirmed_by_*`

### 8. Notificações & realtime
- Triggers `notify_on_*`, `tr_push_*`, `notify_push` (vault `project_url`)
- `useRealtimeInvalidate`, `useGlobalRealtimeAlerts`, badges de unread

### 9. Moderação
- `blocked_users` + `reports`, filtro `getBlockedUserIds` em todas as superfícies
- Painel admin: `has_role`, RBAC, edge functions admin

### 10. Geolocalização
- `nearby_items` PostGIS, `LocationSearch`, profile lat/lng nulos

### 11. Segurança transversal
- Rodar `supabase--linter` + `security--run_security_scan`
- Revisar `GRANT`s, `SECURITY DEFINER` functions, RLS `USING (true)`
- Storage buckets públicos (`item-images`, `chat-media`)
- Validação client-side vs server-side, XSS em campos livres

### 12. Estado & UX crítica
- Race conditions: duplo submit, rapid swipes, cancelar+aceitar simultâneo
- Refresh em rotas profundas, deep links Capacitor
- Offline (`OfflineScreen`), expired session redirect
- Cálculos financeiros (BRL inteiros), faixa de troca (margin_up/down)

## Metodologia
1. **Leitura estática:** todos os arquivos em `src/pages`, `src/services`, `src/hooks`, `supabase/functions`
2. **Revisão SQL:** triggers, RLS e RPCs (já listados no contexto)
3. **Linter Supabase + Security Scan**
4. **Consultas de leitura ao banco** para detectar inconsistências reais (ex: matches órfãos, itens sem owner, ratings duplicados)
5. **Browser de teste**: percorrer fluxos críticos (cadastro, swipe, proposta, chat, confirmação, cancelamento) com inputs adversariais — apenas leitura/observação
6. **Sem edição de código**

## Formato do relatório
Cada bug terá:

```
### [SEV] Título
- Local: arquivo:linha ou tabela/função
- Fluxo afetado:
- Papel do usuário:
- Reprodução:
- Esperado:
- Observado:
- Impacto de negócio:
- Risco técnico:
- Causa-raiz provável:
- Correção sugerida:
- Classificação: Blocking | Risky | Improvement
```

Agrupado em:
- 🔴 **Critical** (perda de dados, RCE, bypass de auth/RLS, dinheiro/troca incorreta)
- 🟠 **High** (fluxos quebrados, abuso possível, race conditions)
- 🟡 **Medium** (validações ausentes, UX que confunde regras de negócio)
- 🟢 **Low** (melhorias, hardening, observabilidade)

Inclui sumário executivo no topo: contagem por severidade, top 5 riscos, recomendações prioritárias.

## Entregável
Arquivo único: `/dev-server/AUDITORIA_BUGS.md`. Nenhuma outra mudança no projeto.
