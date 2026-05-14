# Plano: Vídeo & Áudio Chamada no Chat (LiveKit Cloud)

Stack: **LiveKit Cloud** (servidor SFU gerenciado) + **livekit-client** + **@livekit/components-react** no front + Edge Function Supabase para emissão de tokens + Capacitor para permissões nativas.

Por que LiveKit: open-source, free tier 10k min/mês, SDK JS roda direto no WebView do Capacitor (sem plugin nativo extra), suporta vídeo+áudio, screen-share futuro, gravação opcional, e migrável para self-host depois sem reescrever cliente.

---

## Fluxo de produto

1. Usuário abre uma `Conversa` (já existente).
2. No header do chat aparecem 2 botões: `Phone` (áudio) e `Video` (vídeo).
3. Ao tocar, cria-se um `call_session` no banco (status `ringing`) e o iniciador entra na sala LiveKit.
4. O outro participante recebe um **toast persistente / tela de incoming call** via Supabase Realtime (mesmo canal já usado no chat).
5. Aceitar → entra na sala. Recusar → marca `declined`. Sem resposta em 45s → `missed`.
6. Tela de chamada full-screen: vídeo remoto grande, self-view PiP, controles (mute, câmera on/off, flip camera, hangup).
7. Ao encerrar: salva duração no banco e injeta uma mensagem de sistema no chat (`📞 Chamada de vídeo · 02:14`).

---

## Arquitetura

```text
[Cliente A]                [Supabase]                 [Cliente B]
    │  start call            │                           │
    ├──insert call_sessions──►│                           │
    │                         │──realtime INSERT─────────►│  (incoming UI)
    ├──invoke livekit-token──►│                           │
    │◄──token + room name─────┤                           │
    │                         │◄──invoke livekit-token───┤
    │                         │──token────────────────────►│
    │                         │                           │
    └──────► LiveKit Cloud SFU ◄──────────────────────────┘
              (mídia P2P/SFU)
```

Sinalização de "tocar/aceitar/recusar" passa pelo **Supabase Realtime** (tabela já com publication). Mídia passa pelo **LiveKit SFU**. Sem servidor de signaling próprio.

---

## Banco de dados (1 migration)

Tabela `call_sessions`:
- `conversation_id` → vincula ao chat existente
- `caller_id`, `callee_id`
- `room_name` (uuid único)
- `kind` ('video' | 'audio')
- `status` ('ringing' | 'accepted' | 'declined' | 'missed' | 'ended')
- `started_at`, `accepted_at`, `ended_at`, `duration_seconds`

RLS:
- SELECT/INSERT/UPDATE: apenas participantes da `conversation` (reaproveita `is_conversation_participant`).
- Trigger guard: só o `callee` pode mudar para `accepted`/`declined`; só os 2 participantes para `ended`.

Adicionar à publication `supabase_realtime` (padrão já usado).

Mensagem de sistema ao encerrar via trigger AFTER UPDATE quando `status='ended'`: insere row em `messages` com `message_type='system'` e o resumo da chamada.

---

## Edge Function: `livekit-token`

- Auth obrigatória (valida JWT do caller).
- Input: `{ conversation_id, kind, action: 'start' | 'join', call_session_id? }`.
- Valida que o usuário é participante da conversa (RPC).
- Em `start`: cria a row `call_sessions`. Em `join`: valida que pertence à sessão.
- Gera **AccessToken** assinado via `livekit-server-sdk` (npm) com:
  - `identity` = `user.id`
  - `name` = display_name
  - `room` = `room_name`
  - grants: `roomJoin`, `canPublish`, `canSubscribe`
  - TTL 10 min
- Retorna `{ token, url, room_name, call_session_id }`.

Secrets necessários (Supabase): `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL` (ex: `wss://hypou-xxxxx.livekit.cloud`).

---

## Frontend

Dependências novas:
- `livekit-client`
- `@livekit/components-react` (UI primitives prontas: `RoomAudioRenderer`, `ParticipantTile`, etc.)
- `@livekit/components-styles` (CSS base — vamos sobrescrever com nossos tokens semânticos)

Componentes/arquivos:

1. `src/services/callService.ts` — `startCall()`, `joinCall()`, `endCall()`, `declineCall()` (insert/update na `call_sessions` + invoke da edge function).
2. `src/hooks/useIncomingCalls.ts` — assina realtime em `call_sessions` filtrando `callee_id = auth.uid() AND status='ringing'`. Dispara state global.
3. `src/components/IncomingCallSheet.tsx` — overlay fullscreen com avatar, nome, botões aceitar/recusar; toca ringtone (`<audio>` em loop). Renderizado uma vez no `App.tsx` (igual ao `Toaster`).
4. `src/components/CallRoom.tsx` — wrapper do `LiveKitRoom`. Layout fullscreen Liquid Glass: vídeo remoto cobre tudo, self-view PiP arrastável (framer-motion), barra de controles flutuante embaixo (mute, camera toggle, switch camera, end). Reutiliza tokens (`bg-background`, `text-foreground`, `--primary`).
5. `src/pages/Call.tsx` — rota `/chamada/:roomName` (lazy). Lê token via state ou refetch e monta `CallRoom`. Sai com `navigate(-1)`.
6. `src/pages/Conversa.tsx` (edição) — adiciona `Phone` + `Video` no header, chamando `startCall(kind)` e navegando para `/chamada/...`.

UX state:
- Timeout de 45s sem `accepted` → caller marca `missed` e fecha.
- `useGlobalRealtimeAlerts` atualizado para ignorar `call_sessions` (já tem o hook próprio).
- Background/foreground (Capacitor `App` plugin): se app vai pra background durante call, pausa câmera mas mantém áudio.

---

## Capacitor / Mobile

Permissões:
- `iOS Info.plist`: `NSCameraUsageDescription`, `NSMicrophoneUsageDescription` (textos em PT).
- `AndroidManifest`: `CAMERA`, `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS`, `BLUETOOTH_CONNECT`.
- Pedido em runtime via `navigator.mediaDevices.getUserMedia` (LiveKit faz isso, mas adicionamos pré-check com toast amigável).

WebView:
- iOS WKWebView 14.5+ suporta WebRTC ✅
- Android WebView atualizada idem ✅
- Sem precisar de plugin nativo (mantém fluxo mais simples). Caso futuro queiramos PiP nativo / call-kit, plugamos `@capacitor-community/call-kit`.

`capacitor.config.ts`: garantir `Permissions` do plugin de Camera já presente cobre o caso. Sem mudanças extras imediatas.

Background/lockscreen:
- v1: chamada só funciona com app aberto (limitação WebView).
- v2 (futuro, fora deste plano): plugin nativo CallKit/ConnectionService para tocar com tela bloqueada.

---

## Segurança

- Token só é emitido pela edge function após validar participação na conversa.
- TTL curto (10 min) — refresh automático se a call passar disso.
- `call_sessions` com RLS estrita.
- LiveKit API secret nunca vai pro cliente.
- Bloqueio: se um dos usuários estiver em `blocked_users`, a edge function recusa.

---

## Telemetria & limites

- Log de duração total por dia em `admin/status` (KPI futuro).
- Limite suave: 1 chamada ativa por usuário (UPSERT impede duplicado via UNIQUE parcial `WHERE status IN ('ringing','accepted')`).

---

## Tarefas (ordem de implementação)

1. **Migration** `call_sessions` + RLS + trigger guard + trigger de mensagem-sistema + publication.
2. **Secrets**: pedir ao usuário `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL`.
3. **Edge function** `livekit-token` com validação + emissão.
4. **Service + hook** (`callService`, `useIncomingCalls`).
5. **UI Incoming** (`IncomingCallSheet` + ringtone asset).
6. **UI Call Room** (`CallRoom`, página `/chamada/:roomName`, rota lazy).
7. **Integração Conversa**: botões no header.
8. **Permissões nativas**: editar Info.plist e AndroidManifest (será aplicado ao rodar `npx cap sync`).
9. **Memória do projeto**: criar `mem://features/chat/video-call-architecture` documentando.
10. **Doc**: atualizar `documentacao.md`.

---

## O que o usuário precisa fazer

1. Criar conta gratuita em **livekit.io** → criar um project → copiar `API Key`, `API Secret` e `WS URL` (ex: `wss://seuprojeto.livekit.cloud`).
2. Quando eu pedir, colar esses 3 secrets no Lovable Cloud.
3. Após o deploy, rodar `npx cap sync` no fork local para aplicar permissões nativas.

Quer que eu siga com esse plano?
