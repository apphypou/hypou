

# Plano: Corrigir fluxo de cadastro e login

## Problema

Dois problemas distintos:
1. **Email confirmation esta ativada no Supabase** — ao criar conta, o Supabase exige confirmacao por email antes de permitir login. Os logs mostram erro "Email not confirmed".
2. **Apos cadastro, o usuario nao entra automaticamente** — deveria ir direto para o onboarding sem precisar fazer login novamente.

## Solucao

### Passo 1: Desativar confirmacao de email no Supabase Dashboard

Voce precisa fazer isso manualmente:
1. Acesse **Supabase Dashboard → Authentication → Providers → Email**
2. Desmarque **"Confirm email"**
3. Salve

Isso resolve o erro "Email not confirmed" imediatamente.

### Passo 2: Garantir auto-login apos cadastro (codigo)

O `signUp` do Supabase ja retorna uma sessao automaticamente quando email confirmation esta desativada. O codigo atual navega para `/onboarding` apos signup, mas precisa aguardar a sessao ser estabelecida pelo `onAuthStateChange` antes de navegar.

**Arquivos a alterar:**
- `src/pages/Cadastro.tsx` — apos `signUp`, aguardar que o `user` esteja disponivel no contexto antes de navegar, e registrar terms_accepted usando o user retornado pelo signup (em vez de chamar `getUser` separadamente)
- `src/hooks/useAuth.tsx` — retornar o user do resultado do `signUp` para uso imediato

### Passo 3: Melhorar tratamento de erro no login

- `src/pages/Login.tsx` — traduzir a mensagem "Email not confirmed" para portugues claro caso ainda apareca em contas antigas

## Detalhes tecnicos

| Arquivo | Acao |
|---|---|
| `src/pages/Cadastro.tsx` | Usar user do resultado do signUp; navegar apos sessao confirmada |
| `src/hooks/useAuth.tsx` | Retornar dados do user no resultado do signUp |
| `src/pages/Login.tsx` | Traduzir mensagens de erro de auth |
| Supabase Dashboard | Desativar "Confirm email" (manual) |

