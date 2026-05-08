---
name: Realtime Sync Pattern
description: useRealtimeInvalidate hook + supabase_realtime publication for live UI updates without page reload
type: feature
---
Sincronização em tempo real do app inteiro via Supabase Realtime — usuário nunca precisa recarregar a página para ver propostas, mensagens, status de match, ratings ou edições de perfil.

**Hook central:** `src/hooks/useRealtimeInvalidate.ts`
- Recebe `Subscription[]` com `{ table, filter?, event?, invalidateKeys }` e invalida React Query keys quando rows mudam.
- Canal único por hook (cleanup automático no unmount). Usa filtros Postgres (`user_id=eq.${uid}`) para reduzir tráfego.

**Tabelas na publicação `supabase_realtime`** (todas com `REPLICA IDENTITY FULL`):
matches, match_items, messages, notifications, conversations, ratings, items, item_images, item_videos, profiles, blocked_users.

**Hooks que já fazem realtime invalidate:**
- `useMatches`/`useMatch` → matches + match_items
- `useProfile` → profiles, items, item_images, matches, ratings (filtro rated_id)
- `useConversations` → conversations + matches
- `useNotifications` → notifications (INSERT, filtro user_id)
- `useMessages` → via `subscribeToMessages` no messageService

**Como adicionar realtime a uma nova feature:**
1. Garantir que a tabela está em `supabase_realtime` (migration `ALTER PUBLICATION ADD TABLE`).
2. No hook que chama `useQuery`, chamar `useRealtimeInvalidate([{ table, filter, invalidateKeys: [queryKey] }], !!user)`.
3. Componentes só consomem `useQuery` — não precisam saber de realtime.
