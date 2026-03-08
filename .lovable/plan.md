

# Plano: Dicas de Seguranca + Termos de Uso antes do Chat

## Resumo

Ao abrir uma conversa pela primeira vez, o usuario vera dois popups sequenciais:
1. **Dicas de seguranca** contra golpes (com botao "Continuar")
2. **Termos de uso do chat** (com checkbox "Li e aceito" + botao "Aceitar e Continuar")

Depois de aceitar, a flag fica salva no banco e nunca mais aparece.

## Implementacao

### 1. Migration: adicionar coluna `chat_terms_accepted_at` na tabela `profiles`

```sql
ALTER TABLE public.profiles 
ADD COLUMN chat_terms_accepted_at timestamptz DEFAULT NULL;
```

Quando `NULL` = usuario ainda nao aceitou. Quando preenchido = ja aceitou.

### 2. Criar componente `ChatSafetyDialog`

Arquivo: `src/components/ChatSafetyDialog.tsx`

Um componente com dois "steps" internos:

**Step 1 — Dicas de Seguranca:**
- Titulo: "Negocie com seguranca"
- Lista de dicas:
  - Nunca compartilhe dados bancarios ou senhas
  - Combine encontros em locais publicos e movimentados
  - Desconfie de ofertas boas demais
  - Verifique o perfil e as avaliacoes do usuario
  - Nao envie pagamentos antecipados
- Botao: "Continuar"

**Step 2 — Termos de Uso:**
- Titulo: "Termos de Uso do Chat"
- Texto resumido dos termos (responsabilidade do usuario, proibicao de conteudo ilegal, Hypou nao se responsabiliza por negociacoes externas)
- Checkbox: "Li e aceito os termos de uso"
- Botao: "Aceitar e Continuar" (desabilitado ate marcar o checkbox)

Ao clicar "Aceitar e Continuar":
- Chama `supabase.from('profiles').update({ chat_terms_accepted_at: new Date().toISOString() })` para o usuario
- Fecha o dialog e libera o chat

### 3. Integrar na pagina `Conversa.tsx`

- Buscar `chat_terms_accepted_at` do perfil do usuario logado
- Se `null`, mostrar `ChatSafetyDialog` como modal bloqueante (nao renderiza o input de mensagem ate aceitar)
- Se ja aceito, chat funciona normalmente

### 4. Arquivos afetados

| Arquivo | Acao |
|---|---|
| Migration SQL | Adicionar coluna `chat_terms_accepted_at` |
| `src/components/ChatSafetyDialog.tsx` | Criar componente |
| `src/pages/Conversa.tsx` | Integrar dialog antes do chat |

