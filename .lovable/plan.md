

# Plano Completo de Seguranca - Hypou App

## Diagnostico Atual (Security Scan)

O scan identificou **10 vulnerabilidades**: 6 criticas (error) e 4 avisos (warn).

---

## Fase 1 - Vulnerabilidades Criticas (Prioridade Maxima)

### 1.1 Dados sensiveis de perfil expostos publicamente
**Problema:** A tabela `profiles` tem SELECT policy `USING (true)`, expondo telefone, coordenadas GPS, tier de assinatura para qualquer pessoa.
**Correcao:** Substituir a policy de SELECT publica por uma que retorne apenas campos nao-sensiveis (display_name, avatar_url, bio) para usuarios anonimos, e dados completos apenas para o proprio usuario.

### 1.2 Emails da waitlist expostos publicamente
**Problema:** A tabela `waitlist` SELECT usa `USING (true)`, qualquer pessoa pode ler todos os emails.
**Correcao:** Restringir SELECT para que cada usuario veja apenas sua propria entrada, ou limitar a admins.

### 1.3 Chat media publicamente acessivel
**Problema:** O bucket `chat-media` e publico e qualquer pessoa pode ver arquivos de conversas privadas.
**Correcao:** Tornar o bucket privado e adicionar policy que verifica participacao na conversa.

### 1.4 Realtime sem autorizacao de canal
**Problema:** Sem policies em `realtime.messages`, qualquer usuario autenticado pode se inscrever em qualquer canal e receber mensagens/matches de outros usuarios.
**Correcao:** Adicionar RLS policies na tabela `realtime.messages` para restringir subscricoes a canais dos proprios matches/conversas do usuario.

### 1.5 Matches broadcast para todos
**Problema:** Atualizacoes de matches sao transmitidas para qualquer subscriber.
**Correcao:** Resolvido junto com 1.4 (realtime policies).

### 1.6 Mensagens privadas broadcast para todos
**Problema:** Conteudo de mensagens de todas as conversas e transmitido.
**Correcao:** Resolvido junto com 1.4.

---

## Fase 2 - Vulnerabilidades de Nivel Warn

### 2.1 RLS policies com `true` em INSERT/UPDATE/DELETE
**Problema:** Algumas tabelas usam expressoes permissivas demais.
**Correcao:** Revisar e restringir policies de `item_images`, `item_videos`, e outras tabelas que usam `{public}` em vez de `{authenticated}`.

### 2.2 Leaked Password Protection desabilitada
**Problema:** O Supabase nao esta verificando senhas vazadas.
**Correcao:** Habilitar no dashboard do Supabase (Auth > Settings).

### 2.3 Upload de chat media sem verificacao de participacao
**Problema:** Qualquer autenticado pode fazer upload no bucket chat-media.
**Correcao:** Adicionar policy de INSERT que verifica participacao na conversa.

### 2.4 Ratings publicamente legiveis
**Problema:** Todos os ratings sao visiveis para anonimos.
**Correcao:** Restringir SELECT para authenticated ou apenas participantes.

---

## Fase 3 - Hardening Adicional (Boas Praticas)

### 3.1 Validacao de input no frontend
- Adicionar validacao com limites de tamanho em todos os formularios (nome de item max 100 chars, descricao max 1000, etc.)
- Sanitizar inputs antes de enviar ao Supabase

### 3.2 Rate limiting na senha
- Senha minima de 8 caracteres (atualmente 6)
- Exigir ao menos 1 numero e 1 letra

### 3.3 Edge Functions - Input validation
- Adicionar validacao Zod em todas as edge functions (`delete-account`, `admin-stats`, `seed-test-users`, `validate-item-price`)
- Atualizar CORS headers para usar import do SDK

### 3.4 Edge Functions - verify_jwt
- Atualmente todas as functions tem `verify_jwt = false` no config.toml
- Para `admin-stats` e `delete-account`: manter false mas garantir validacao JWT em codigo (ja implementado)
- Remover `seed-test-users` do deploy de producao ou proteger com secret

### 3.5 Storage - Tipos de arquivo
- Restringir uploads de imagens para apenas jpg/png/webp
- Restringir uploads de video para mp4/webm
- Limitar tamanho maximo de arquivo

### 3.6 Protecao de rotas
- A rota `/explorar` nao esta protegida por `ProtectedRoute` (linha 70 do App.tsx) - corrigir

---

## Ordem de Implementacao

| Etapa | O que | Tipo |
|-------|-------|------|
| 1 | Fix profiles SELECT policy | Migration SQL |
| 2 | Fix waitlist SELECT policy | Migration SQL |
| 3 | Tornar chat-media privado + policies | Migration SQL |
| 4 | Adicionar realtime policies | Migration SQL |
| 5 | Fix ratings SELECT policy | Migration SQL |
| 6 | Restringir roles de policies (public -> authenticated) | Migration SQL |
| 7 | Proteger rota /explorar | Codigo |
| 8 | Validacao de inputs nos formularios | Codigo |
| 9 | Fortalecer regras de senha | Codigo |
| 10 | Validacao Zod nas edge functions | Codigo |
| 11 | Habilitar leaked password protection | Dashboard Supabase (manual) |
| 12 | Restringir tipos/tamanhos de upload | Codigo + Storage policies |

---

## Nota Importante

O item 11 (Leaked Password Protection) precisa ser habilitado manualmente pelo dono do projeto no dashboard do Supabase em **Authentication > Settings > Security**. Vou indicar isso apos a implementacao.

