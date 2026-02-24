

## Problema

O layout atual coloca **todo o texto sobre a imagem** com um gradiente fraco — o resultado e texto ilegivel, visual sujo, e a imagem fica cortada/obstruida. A referencia mostra um design completamente diferente: **imagem na parte superior, conteudo em fundo solido na parte inferior do card**.

## Diagnostico

O `SwipeCard` usa `absolute inset-0` para a imagem (ocupa 100% do card) e o conteudo flutua sobre ela com `mt-auto` e um gradiente `from-black/70`. Isso nao funciona com imagens claras e cria o visual "sujo" da screenshot.

## Plano de Alteracoes

### `src/components/SwipeCard.tsx` — Reestruturar layout do card

Mudar de "texto sobre imagem" para **layout dividido vertical**:

- **Parte superior (~60%)**: imagem com `object-cover`, sem gradientes pesados. Apenas um gradiente sutilissimo no topo para o mini-perfil do dono.
- **Parte inferior (~40%)**: fundo solido `bg-card dark:bg-muted` com padding, contendo toda a informacao (categoria, nome, valor, localizacao, condition, descricao).
- Remover todos os `textShadow` inline dos textos — nao sao mais necessarios com fundo solido.
- Remover o gradiente `from-black/70` que cobria a imagem inteira.
- Os dots da galeria ficam sobre a imagem (mantem posicao atual).
- O mini-perfil do dono fica sobre a imagem (mantem posicao atual), com um gradiente sutil `from-black/30 to-transparent` apenas no topo para garantir leitura.

### `src/pages/Explorar.tsx` — Ajustar stack cards

- Os cards de stack (segundo e terceiro) tambem devem refletir o novo layout — remover os gradientes `from-background` que cobriam a imagem inteira e ajustar para mostrar apenas a imagem de preview.

### Resultado visual esperado

```text
┌──────────────────────────────┐
│ 👤 Bruno Ferreira    ● ● ○  │
│                              │
│         [ IMAGEM ]           │  ← ~60% do card
│         sem gradiente        │
│                              │
├──────────────────────────────┤
│  VIDEOGAMES                  │  ← fundo solido
│  PC Gamer RTX 4060           │     bg-card / bg-muted
│  R$ 3.500,00                 │
│  📍 Goiânia • 📦 Usado       │
│  Descricao curta aqui...     │
└──────────────────────────────┘
```

### Arquivos modificados

| Arquivo | Mudanca |
|---|---|
| `src/components/SwipeCard.tsx` | Layout dividido: imagem top 60%, conteudo em fundo solido bottom 40%. Remover gradientes pesados e textShadow |
| `src/pages/Explorar.tsx` | Ajustar gradientes nos cards de stack para consistencia |

