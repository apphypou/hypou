

## Plano: Recomendacao Inteligente + Indicador de Compatibilidade

### O que muda para o usuario

1. O feed mostra apenas itens compativeis com o valor dos seus produtos (nao ve mais itens fora da sua faixa de troca)
2. Itens ja swipados nunca voltam
3. No canto superior direito do card, aparece um **circulo com a foto do SEU item** que e compativel com aquele anuncio — o usuario entende instantaneamente "posso trocar MEU item X por isso"

### Implementacao

#### 1. Migration: RPC `recommended_items`

Funcao PostgreSQL que:
- Busca os itens do usuario logado e calcula a faixa de valor aceitavel (market_value +/- margins)
- Exclui itens ja swipados e de usuarios bloqueados
- Filtra itens de outros usuarios cujo valor cai na faixa de pelo menos um item do usuario
- **Retorna o `matched_item_id` e `matched_item_image`** — qual item do usuario e compativel com cada resultado
- Ordena por: match de valor+categoria > match de valor > discovery
- Limite de 50 itens

#### 2. Atualizar `itemService.ts`

- Nova funcao `getRecommendedItems(userId)` chamando o RPC
- Busca images/videos/profiles apos o RPC (mesmo padrao do `getNearbyItems`)
- Cada item retornado inclui `matched_own_item: { id, name, image_url }`

#### 3. Atualizar `SwipeCard.tsx`

- Nova prop `matchedOwnItem?: { id: string; name: string; image_url: string }`
- Renderizar no **canto superior direito** (oposto ao perfil do dono que fica no canto superior esquerdo): circulo com a foto do item do usuario, com borda em gradiente primary, tooltip com nome do item
- Estilo: `h-10 w-10 rounded-full border-2 border-primary` com backdrop blur, similar ao owner mini-profile

#### 4. Atualizar `Explorar.tsx`

- Trocar `getExploreItems` por `getRecommendedItems` para logados
- Passar `matchedOwnItem` para cada `SwipeCard`
- Remover estados residuais de filtro (`activeFilter`, `distanceFilter`, `distanceOptions`, imports de categorias)
- Remover loop infinito: quando acabar os itens, empty state "Voce ja viu tudo!"

#### 5. Limpeza

- Remover `getExploreItems` e `getNearbyItems` do `itemService.ts` (substituidos pelo RPC)
- Remover import de `useGeolocation` do Explorar
- Manter `getPublicExploreItems` para guests

### Layout do card (esquema)

```text
┌─────────────────────────────┐
│ [👤 Dono]          [📷 Meu] │  ← esquerda: perfil dono / direita: meu item compativel
│                             │
│         IMAGEM              │
│                             │
│  ┌─────────────────────┐    │
│  │ Nome · R$ · Share   │    │  ← painel inferior glass
│  └─────────────────────┘    │
└─────────────────────────────┘
```

