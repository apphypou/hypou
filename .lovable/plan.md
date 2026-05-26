## Correções

### 1. Tradução do erro no ResetPassword
Em `src/pages/ResetPassword.tsx`, no `handleSubmit`, mapear mensagens do Supabase para PT-BR antes do toast:
- `"different from the old password"` / `"same as the old password"` → **"A nova senha precisa ser diferente da atual."**
- `"at least"` / `"weak password"` → **"Senha muito curta (mín. 6 caracteres)."**
- `"rate limit"` → **"Muitas tentativas, aguarde um momento."**
- Demais erros: fallback **"Não foi possível atualizar a senha. Tente novamente."**

### 2. Logo do e-mail
Em `supabase/functions/send-auth-email/_templates.ts`:
- Trocar `LOGO_URL` de `https://hypou.app/logo-hypou.png` (domínio não publicado) para `https://hypou.lovable.app/logo-hypou.png` (URL pública real do app, onde `public/logo-hypou.png` já existe).

### 3. Documentação
Atualizar `documentacao.md` com:
- Tratamento amigável de erros no reset de senha (PT-BR).
- URL absoluta do logo nos templates de e-mail apontando para o domínio publicado.

Sem mudanças de banco, RLS, edge function logic, rotas ou fluxos. Apenas strings de UI e uma URL.
