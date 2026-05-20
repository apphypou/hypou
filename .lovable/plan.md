# Plano: Zero-Reload — sincronização realtime universal

## Objetivo
Tudo que o usuário vê (chat, chamadas perdidas, itens novos, propostas, perfil, notificações, badges) deve atualizar sozinho via Supabase Realtime + React Query, mesmo após:
- voltar de background (Capacitor / aba inativa)
- perda momentânea de conexão
- troca de rota

## Diagnóstico atual

O que já funciona:
- `useRealtimeInvalidate` em `useProfile`, `useMatches`, `useNotifications`, `useConversations`, `useMessages`
- `useGlobalRealtimeAlerts` (toasts globais de notif/proposta/msg)
- `useIncomingCalls` (chamada entrando ao vivo)
- Invalidations manuais após `NovoItem` / `EditarItem`

Gaps que ainda forçam reload percebido:
1. **Reconexão Realtime**: Supabase Realtime cai quando o app fica em background no mobile (Capacitor) ou aba dorme. Não há código que force `removeAllChannels` + reassinar nem `queryClient.invalidateQueries()` no `resume`/`visibilitychange`/`online`.
2. **React Query defaults**: não há config explícita de `refetchOnWindowFocus`, `refetchOnReconnect`, `refetchOnMount`. Em mobile o "focus" mal dispara — precisa hook customizado p/ Capacitor `App` lifecycle.
3. **Tabelas sem realtime invalidate**: `item_videos`, `favorites`, `swipes`, `blocked_users`, `user_categories`, `call_sessions` (lista global), `reports`. Algumas dessas alimentam telas (Shorts, MeuPerfil favoritos, Configurações bloqueados, ChamadasPerdidas).
4. **`ChamadasPerdidas`**: provavelmente só faz fetch no mount; nova chamada perdida não aparece sem reload.
5. **`useConversations`** usa `refetchInterval: 30s` como fallback — sintoma de que o realtime não é confiável; trataremos a causa.
6. **Publicação `supabase_realtime`**: precisamos auditar se todas as tabelas alvo estão na publication com `REPLICA IDENTITY FULL` (faltam confirmação: `item_videos`, `favorites`, `swipes`, `call_sessions`, `user_categories`).
7. **Canais duplicados**: cada hook cria seu canal com nome randômico — sob hot route changes pode acumular. Vamos centralizar.

## Solução (camadas)

### 1. Camada de transporte resiliente
Criar `src/lib/realtimeManager.ts`:
- Wrapper único sobre `supabase.realtime` que:
  - escuta `SYSTEM` events (`CHANNEL_ERROR`, `TIMED_OUT`, `CLOSED`) e reassina automaticamente
  - expõe `forceReconnect()` que faz `supabase.removeAllChannels()` + reassina os canais registrados
  - mantém registro de canais ativos (set) para debug

### 2. Hook global de "app awake"
Criar `src/hooks/useAppLifecycleSync.ts`, montado uma vez em `App.tsx` ao lado de `useGlobalRealtimeAlerts`:
- Escuta `visibilitychange`, `window.online`, `window.focus`
- No Capacitor: escuta `App.addListener('appStateChange', state.isActive)` e `Network.addListener('networkStatusChange')`
- Em qualquer evento de "voltei ativo":
  1. `realtimeManager.forceReconnect()`
  2. `queryClient.invalidateQueries()` (invalida tudo — barato porque é só refetch das ativas)

### 3. Defaults globais do React Query
Em `src/main.tsx` configurar `QueryClient`:
```
defaultOptions: {
  queries: {
    refetchOnWindowFocus: true,
    refetchOnReconnect: 'always',
    refetchOnMount: true,
    staleTime: 30_000,
  }
}
```
(mantendo gcTime atual de 30min)

### 4. Cobrir tabelas faltantes com realtime invalidate
Adicionar `useRealtimeInvalidate` em:
- `useFavorites` (criar se não existir) → `favorites` filtrado por `user_id`
- `useBlockedUsers` (Configuracoes) → `blocked_users` filtrado por `blocker_id`
- `Shorts.tsx` → `item_videos` + `video_likes`
- `ChamadasPerdidas.tsx` → `call_sessions` filtrado por `callee_id` (eventos UPDATE com status `missed`/`ended`)
- `Busca.tsx` → `items` (INSERT/UPDATE) — invalida `search-items`
- `Explorar.tsx` → `items` INSERT global → invalida `explore-items` e `recommended-items`

### 5. Migration: garantir publication completa
Adicionar à publication `supabase_realtime` e setar `REPLICA IDENTITY FULL` para:
`item_videos`, `video_likes`, `favorites`, `swipes`, `call_sessions`, `user_categories`, `blocked_users`, `site_settings`.

### 6. Remover fallbacks de polling agora redundantes
- `useConversations`: remover `refetchInterval: 30000` (passa a confiar no realtime + lifecycle sync).
- Confirmar que nenhum componente faz `window.location.reload()`.

### 7. Mutations: invalidation pattern padronizado
Criar helper `invalidateAfterMutation(queryClient, scopes)` para padronizar invalidações em `NovoItem`, `EditarItem`, `MeuPerfil`, `Matches`, `Conversa` — evita esquecer alguma chave.

## Telas que ficam 100% live após o plano
Explorar, MeuPerfil (itens/stats/avaliações), Partidas, Chat (lista), Conversa (mensagens/status), Notificações (sino), Chamada entrante, Chamadas Perdidas, Shorts (likes/views), Busca, Configurações (bloqueados), Perfil de outro usuário.

## Detalhes técnicos
- Capacitor: usar `@capacitor/app` (`appStateChange`) e `@capacitor/network`. Já existem no projeto? Validar em `package.json` na implementação — se faltar `@capacitor/network`, instalar.
- `realtimeManager` deve evitar reconexão em <2s do último reconnect (debounce) para não bater no servidor.
- Toda `useRealtimeInvalidate` nova com `filter` específico (`user_id=eq.${uid}`) para minimizar tráfego.
- Atualizar `documentacao.md` com a nova arquitetura (camada lifecycle + manager).

## Entregáveis
1. `src/lib/realtimeManager.ts`
2. `src/hooks/useAppLifecycleSync.ts` (montado em `App.tsx`)
3. QueryClient defaults em `src/main.tsx`
4. Realtime invalidate adicionados nos hooks/páginas listados
5. Migration Supabase: publication + replica identity
6. Limpeza dos `refetchInterval` redundantes
7. Atualização de `documentacao.md`
