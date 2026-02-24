

## Problema Atual

O card ocupa boa parte da tela mas **nao mostra informacoes importantes** como estado de uso (condition) e descricao. Os botoes Passar/Hypou estao colados logo abaixo do card, desperdicando espaco vertical. O layout precisa de dois ajustes: **esticar o card** para preencher mais a tela e **empurrar os botoes para baixo**, mais perto do BottomNav.

## Diagnostico Tecnico

- A tabela `items` tem campos `condition` e `description` que **ja existem no banco** mas nao sao exibidos no SwipeCard.
- O card atualmente tem `max-h-[620px]` e os botoes ficam com `pt-5` logo abaixo.
- O conteudo do card (zona de texto) so mostra: categoria, nome, localizacao e valor de mercado.

## Plano de Alteracoes

### 1. `src/components/SwipeCard.tsx` — Adicionar condition e description no conteudo do card

- Abaixo da localizacao e acima do valor de mercado, adicionar:
  - **Estado de uso** — badge/pill mostrando `item.condition` (ex: "Usado", "Novo", "Semi-novo"). Se nulo, nao exibir.
  - **Descricao** — texto truncado em 2 linhas (`line-clamp-2`) com `text-foreground/50 text-sm`.
- Importar o icone `Package` do lucide para acompanhar o estado de uso.

### 2. `src/pages/Explorar.tsx` — Layout: card maior, botoes mais baixos

- Remover o `max-h-[620px]` do container do card, deixando ele ocupar todo o `flex-1` disponivel.
- Tirar os botoes de dentro do `<main>` e posiciona-los como bloco fixo acima do BottomNav, usando `fixed bottom-[calc(env(safe-area-inset-bottom)+4.5rem)]` ou similar.
- Reduzir o `pb` do main ja que os botoes serao fixed.
- Botoes com `gap-16` para mais respiro entre eles.

### Resultado Visual Esperado

```text
┌─────────────────────────┐
│ ENCONTRE TROCAS         │  ← header
│ Explorar Trocas         │
├─────────────────────────┤
│                         │
│      [  IMAGEM  ]       │  ← card ocupa quase toda
│                         │     a altura disponivel
│  CASA            📷 1   │
│  Echo Dot 5a Geracao    │
│  📍 Recife, PE          │
│  📦 Usado               │  ← NOVO: condition
│  Descricao curta...     │  ← NOVO: description
│  VALOR DE MERCADO       │
│  R$ 3,50                │
├─────────────────────────┤
│                         │
│     (X)        (❤️)      │  ← botoes mais baixos,
│    PASSAR     HYPOU     │     fixos acima do nav
├─────────────────────────┤
│ EXPLORAR TROCAS CHAT... │  ← BottomNav
└─────────────────────────┘
```

### Arquivos Modificados

| Arquivo | Mudanca |
|---|---|
| `src/components/SwipeCard.tsx` | Adicionar exibicao de `condition` e `description` na area de conteudo |
| `src/pages/Explorar.tsx` | Remover max-height do card, mover botoes para posicao fixa inferior |

