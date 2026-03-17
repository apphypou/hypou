

## Problem Analysis

The current auth/navigation flow has gaps that create a confusing experience:

1. **`/explorar` is completely public** (no `ProtectedRoute`) — a logged-in user who hasn't completed onboarding can stay on `/explorar` without being redirected to onboarding
2. **After signup**, the user gets auto-logged in by Supabase. If they were previously browsing `/explorar` as a guest, the `GuestPromptDialog` may still redirect them to `/cadastro` instead of `/onboarding`
3. **`GuestPromptDialog` doesn't account for "logged in but no onboarding"** — it only checks `!user`, so a freshly signed-up user (who IS authenticated) shouldn't see it, but if there's a race condition they get sent to `/cadastro` again

## Ideal Flow (Senior Architect Design)

```text
First Visit:
  / (landing) → "Criar conta" → /cadastro → /onboarding → /explorar
                 "Entrar"     → /login     → /explorar (if onboarding done)
                                            → /onboarding (if not done)

Guest browsing:
  /explorar (public) → like → GuestPromptDialog → /cadastro → /onboarding → /explorar

Returning user:
  /login → /explorar (onboarding already done)
```

## Changes

### 1. Wrap `/explorar` in an onboarding-aware guard (NOT full ProtectedRoute)

In `src/pages/Explorar.tsx`, add an effect that checks: if user is logged in AND `onboarding_completed === false`, redirect to `/onboarding`. This preserves guest browsing while ensuring authenticated users complete onboarding.

### 2. Update `GuestPromptDialog` to handle "logged in, no onboarding"

Add `useAuth()` check — if user IS logged in, navigate to `/onboarding` instead of showing the signup/login buttons. This handles edge cases where auth state updates mid-session.

### 3. Ensure `Login.tsx` redirects through ProtectedRoute properly

After login, navigate to `/explorar` which will be wrapped — the onboarding guard in Explorar will catch users who haven't completed onboarding and redirect them.

### 4. Cadastro.tsx already navigates to `/onboarding` — no change needed

## Technical Details

**Explorar.tsx** — add near the top of the component:
- Query `profiles.onboarding_completed` when `user` exists
- `useEffect`: if user is logged in and `onboarding_completed === false`, `navigate("/onboarding")`

**GuestPromptDialog.tsx**:
- Import `useAuth`, check if user exists
- If user exists → navigate directly to `/onboarding` and close dialog (instead of showing buttons)

These are small, surgical changes — no restructuring of routes or ProtectedRoute needed.

