## Objetivo

1. Email de confirmação passa a exibir a **logo Hypou** e um **código numérico** (em vez de botão de link).
2. Após cadastro, o usuário é levado a uma nova tela onde digita o código para ativar a conta.

> Observação importante: o Supabase gera tokens OTP de **6 dígitos** (não 5). Vou usar 6 — é o padrão e não dá pra reduzir sem quebrar a verificação.

---

## Mudanças

### 1. Email templates (`supabase/functions/send-auth-email/_templates.ts`)
- Adicionar `<img>` da logo no topo (URL pública: `https://hypou.app/logo-hypou.png` — já existe em `public/`).
- Substituir o botão "Confirmar" por um bloco grande mostrando o código de 6 dígitos (`payload.email_data.token`).
- Estilo: fundo escuro `#1C1C1C`, código em destaque com cor primary `#18FDF6`, fonte monoespaçada, letter-spacing largo.
- Manter o link como fallback discreto ("ou clique aqui se preferir").
- Aplicar a todos os templates relevantes: `signup`, `magicLink`, `recovery`, `emailChange`.

### 2. Função `send-auth-email/index.ts`
- Atualizar assinatura de `renderEmail` para receber também o `token`, já que hoje só passa a URL.
- Passar `payload.email_data.token` para os templates.

### 3. Nova tela `src/pages/ConfirmarCodigo.tsx`
- Recebe o email via state/query param.
- 6 inputs estilizados (ou um input único com `inputMode="numeric"` e máscara) — vou usar o componente `InputOTP` do shadcn (já existe em `src/components/ui/input-otp.tsx` se disponível, senão adiciono).
- Botão "Confirmar" → chama `supabase.auth.verifyOtp({ email, token, type: 'signup' })`.
- Em caso de sucesso → navega para `/onboarding`.
- Botão "Reenviar código" → `supabase.auth.resend({ type: 'signup', email })` com cooldown de 60s.
- Tratamento de erros: código inválido / expirado / já usado.
- Visual seguindo o design system (Liquid Glass, NeonButton, header padrão de auth).

### 4. Rota
- Adicionar `/confirmar-codigo` no `src/App.tsx` (rota pública).

### 5. Fluxo de cadastro (`src/pages/Cadastro.tsx`)
- Após `signUp` bem-sucedido, navegar para `/confirmar-codigo?email=...` (em vez de `/onboarding`).
- O onboarding só roda **depois** que o código for verificado.

### 6. Onboarding guard
- O `OnboardingGuard` já redireciona quem não está autenticado. Como `verifyOtp` cria a sessão, o fluxo natural funciona: confirmar código → sessão ativa → onboarding.

### 7. Documentação
- Atualizar `documentacao.md` com o novo fluxo de verificação por código.

### 8. Memória
- Atualizar `mem://features/auth/fluxo-cadastro-e-login` para refletir OTP de 6 dígitos em vez de link.

---

## Detalhes técnicos

- `supabase.auth.verifyOtp({ email, token, type: 'signup' })` — cria sessão ao validar.
- A logo precisa estar acessível por URL pública HTTPS no email. `public/logo-hypou.png` já é servida em `https://hypou.app/logo-hypou.png` (domínio custom) e também em `https://hypou.lovable.app/logo-hypou.png`. Vou usar `hypou.app`.
- Não precisa mexer em config do Supabase — o hook `Send Email` já está ativo e o `token` já vem no payload.

---

## Arquivos tocados

```text
supabase/functions/send-auth-email/_templates.ts   (modificar)
supabase/functions/send-auth-email/index.ts        (modificar)
src/pages/ConfirmarCodigo.tsx                      (novo)
src/pages/Cadastro.tsx                             (modificar redirect)
src/App.tsx                                        (nova rota)
documentacao.md                                    (atualizar)
mem://features/auth/fluxo-cadastro-e-login        (atualizar)
```
