---
name: Push Nativo via FCM
description: Capacitor Push Notifications + FCM HTTP v1, triggers SQL via pg_net + Vault, breaks "no web push" rule for native only
type: feature
---
Push nativo apenas no Capacitor (iOS/Android). Web continua só com realtime in-app.

**Arquitetura:**
- Tabela `device_tokens` (user_id, token UNIQUE, platform). Usuário gerencia próprios via RLS.
- Hook `usePushRegistration` registra token quando `Capacitor.isNativePlatform()`. Navega ao tocar push.
- Edge function `send-push` autenticada via `SUPABASE_SERVICE_ROLE_KEY`. Usa `FCM_SERVICE_ACCOUNT_JSON` para JWT RS256 → OAuth → FCM v1.
- Função SQL `notify_push(user, title, body, data)` chama edge via `extensions.net.http_post`, lê URL + service key do `vault.decrypted_secrets` (`project_url`, `service_role_key`).
- Triggers: `messages` INSERT, `call_sessions` INSERT (ringing), `matches` INSERT (proposta) e UPDATE (accepted).
- Tokens inválidos (UNREGISTERED) são removidos automaticamente.

**Tela "Chamadas perdidas":** `src/pages/ChamadasPerdidas.tsx`, rota `/chamadas`, listada do Chat. Filtra `call_sessions.status` in `missed`/`declined`. Botão liga de volta via `startCall`.

**Setup necessário (manual, fora do Lovable):**
1. Criar projeto Firebase com apps Android (`app.hypou.mobile`) e iOS.
2. Gerar service account JSON → secret `FCM_SERVICE_ACCOUNT_JSON`.
3. APNs Auth Key (.p8) → upload no Firebase iOS app.
4. Vault: `vault.create_secret('https://gfvqympaaglkplzbocbl.supabase.co','project_url')` e `vault.create_secret('<SERVICE_ROLE_KEY>','service_role_key')`.
5. Após `git pull` local: colocar `google-services.json` em `android/app/` e `GoogleService-Info.plist` em `ios/App/App/`, então `npx cap sync`.

Se vault não configurado: `notify_push` retorna silenciosamente — app funciona normal sem push.
