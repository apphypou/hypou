

# Plano: Validacao de Preco com IA via Pesquisa Web

## Problema

Limites fixos por categoria nao funcionam -- um carro pode valer R$ 5.000 ou R$ 1.000.000. A solucao e usar IA com acesso a web para verificar se o valor informado e compativel com o item descrito.

## Fluxo

```text
Usuario preenche nome + categoria + valor
        |
        v
Clica "Cadastrar Item"
        |
        v
Edge Function "validate-item-price"
  → Envia para Lovable AI (Gemini) com search grounding:
    "O item '[nome]' na categoria '[categoria]', condicao '[condicao]', vale aproximadamente R$ [valor]? 
     Pesquise precos reais e responda com JSON: {valid: bool, reason: string, suggested_range: {min, max}}"
        |
        v
Se valid=true → salva normalmente
Se valid=false → mostra alerta com motivo + faixa sugerida, usuario pode corrigir ou confirmar
```

## Implementacao

### 1. Edge Function `validate-item-price`

Arquivo: `supabase/functions/validate-item-price/index.ts`

- Recebe: `{ name, category, condition, value_cents }`
- Chama Lovable AI Gateway (`google/gemini-2.5-flash`) com tool calling para retornar JSON estruturado:
  - `valid` (boolean)
  - `reason` (string -- explicacao em portugues)
  - `suggested_min_cents` (number)
  - `suggested_max_cents` (number)
- Usa `LOVABLE_API_KEY` (ja configurado)
- Timeout de 10s -- se a IA nao responder, aceita o valor (fail-open para nao bloquear UX)

### 2. `src/services/itemService.ts`

- Adicionar funcao `validateItemPrice(name, category, condition, valueCents)` que chama a edge function via `supabase.functions.invoke('validate-item-price', ...)`
- Retorna `{ valid, reason, suggestedMin, suggestedMax }`

### 3. `src/pages/NovoItem.tsx`

- No `handleSubmit`, antes de `createItem`:
  1. Chamar `validateItemPrice`
  2. Se `valid=true` → continua normalmente
  3. Se `valid=false` → mostra dialog de alerta com:
     - Motivo da rejeicao (ex: "Um Moto G usado normalmente custa entre R$ 500 e R$ 1.200")
     - Faixa sugerida
     - Dois botoes: "Corrigir valor" (volta ao form) e "Cadastrar mesmo assim" (ignora e salva)
- Mostrar loading state durante validacao ("Verificando valor...")

### 4. `src/pages/EditarItem.tsx`

- Mesma logica de validacao ao salvar alteracoes

### 5. `supabase/config.toml`

- Adicionar entry para a nova function com `verify_jwt = false`

## Decisoes de Design

- **Fail-open**: se a IA falhar ou demorar, o item e cadastrado normalmente. Nao bloqueia o usuario.
- **Nao bloqueia hard**: mesmo com preco suspeito, o usuario pode "Cadastrar mesmo assim". Isso reduz friccao mas educa.
- **Sem tabela nova**: nao precisa de migration. A validacao e stateless via edge function.
- **Custo**: 1 chamada de IA por cadastro/edicao de item. Usa modelo flash (barato e rapido).

## Arquivos afetados

| Arquivo | Acao |
|---|---|
| `supabase/functions/validate-item-price/index.ts` | Criar |
| `supabase/config.toml` | Adicionar function entry |
| `src/services/itemService.ts` | Adicionar `validateItemPrice()` |
| `src/pages/NovoItem.tsx` | Integrar validacao no submit |
| `src/pages/EditarItem.tsx` | Integrar validacao no submit |

