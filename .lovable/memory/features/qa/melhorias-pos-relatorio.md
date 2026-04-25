---
name: HEIC + Haptics + Numeric Badge
description: HEIC iOS conversion via heic2any, native haptics via @capacitor/haptics, numeric BottomNav badge (99+), session-persisted proposal context, rate-limit on validate-item-price (5/min).
type: feature
---
Conjunto de melhorias de UX/produção implementado a partir do relatório de QA:

**Mídia**
- `src/lib/fileValidation.ts` agora aceita `image/heic` e `image/heif` (até 15 MB) e expõe `isHeicFile()` e `ensureWebCompatibleImage()` que converte para JPEG via `heic2any` (dynamic import).
- Conversão aplicada em `uploadItemImage`, `uploadAvatar` e `uploadChatMedia`.

**Haptics**
- `src/lib/haptics.ts` — wrapper `haptic(intensity)` usa `@capacitor/haptics` em nativo e `navigator.vibrate` no web. Intensidades: light/medium/heavy/success/warning/error.
- Aplicado em swipe like/dislike e em sucesso/erro de proposta.

**BottomNav**
- Badge numérico (até "99+") em vez de dot pulsante, com `aria-label` para acessibilidade.

**Proposta resiliente**
- Em `Explorar`, o item curtido fica em `sessionStorage["hypou:pending-like-item"]`; ao voltar de `/novo-item`, o `SelectItemDialog` é reaberto automaticamente, evitando que o usuário "perca" a proposta.

**Edge function**
- `validate-item-price` agora aplica rate limit em memória de 5 req/min por token (chave: últimos 32 chars do `Authorization` ou IP), retornando 429 com `Retry-After`.
