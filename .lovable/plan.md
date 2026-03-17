

## Plano de Melhorias do Hypou — IMPLEMENTADO ✅

### Fase 1 — Críticas ✅
1. **Busca de itens** — `/busca` com texto, categoria, condição ✅
2. **Curtir sem item cadastrado** — Like salva como favorito, proposta via MeuPerfil ✅
3. **Feed vazio melhorado** — CTAs: cadastrar item, vitrine, convidar amigos ✅

### Fase 2 — Alta Prioridade ✅
4. **Sinais de confiança no SwipeCard** — Rating, nº de trocas, tempo na plataforma ✅
5. **Sugestão automática de preço** — Botão "Sugerir" em NovoItem e EditarItem ✅
6. **TradeRangeCard simplificado** — Linguagem clara, sem percentagens ✅

### Fase 3 — Média Prioridade ✅
7. **Configurações reais** — Alterar senha, excluir conta, gerenciar bloqueios ✅

### Fase 4 — Melhorias ✅
8. **Negociação no chat** — Status da proposta, aceitar/recusar inline ✅
9. **Sistema de denúncia** — Botão reportar com motivos e descrição ✅

### Tabelas criadas
- `favorites` (user_id, item_id)
- `blocked_users` (blocker_id, blocked_id)
- `reports` (reporter_id, reported_user_id, reason, description)
