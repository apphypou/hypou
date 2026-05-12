## Crítica (visão Apple Senior Designer)

Olhando o card atual:

1. **Foto espremida no topo** — `object-contain object-top` deixa a imagem ocupando ~40% do card. O resto é um vazio escuro. Quebra a hierarquia (foto = herói).
2. **Linha dura entre foto e área escura** — não há blend; parece um corte, não um design.
3. **Gradiente exagerado (h-[26rem])** — "engole" o card. A solução virou o problema.
4. **Botões grudados no Bottom Nav** — sem respiro; duas pílulas competindo no mesmo eixo vertical (Apple nunca empilharia assim).
5. **Botões neutros demais** — Hypou e Flopou são ações opostas; precisam de leitura semântica imediata, mantendo Liquid Glass.
6. **"DETALHES" minúsculo** — affordance fraca, mal posicionada ao lado do preço.
7. **Tipografia plana** — título e preço com mesmo peso; tags inconsistentes (bullets vs ícone).
8. **Dots de paginação invisíveis** sobre céu claro.
9. **Rating "⭐ 5"** sem decimal — visual amador.
10. **Bordas/raios desalinhados** entre card, painel de info, botões e bottom nav.

## Plano

### 1. Reestruturar a anatomia do card
Trocar a sobreposição "imagem inteira + gradient pesado" por **duas zonas definidas**:

```text
┌─────────────────────────┐
│                         │
│   IMAGEM (object-cover) │  ← 62% da altura
│   sempre preenche       │
│                         │
├─ blur fade (24px) ──────┤  ← transição suave
│   PAINEL LIQUID GLASS   │
│   tags · título · preço │  ← 38% da altura
│   [Ver detalhes] chev   │
└─────────────────────────┘
```

- Imagem usa `object-cover object-center` — nunca mais espaço vazio.
- Painel inferior é uma superfície real (`backdrop-blur-2xl`, `bg-white/8`, `border-t border-white/10`), com cantos inferiores arredondados acompanhando o card.
- Entre as duas zonas: faixa de 24px com `mask-image` linear pra fade orgânico (sem corte duro).
- Remover o gradient gigante `h-[26rem]`; manter só um leve `from-black/30` no topo da imagem pra legibilidade do chip do dono.

### 2. Painel de informação (Liquid Glass)
- Padding: `px-5 pt-4 pb-5`.
- **Linha 1 — tags** (uma só, truncada): categoria · condição · localização, todas com mesmo estilo (`text-[10px] font-semibold tracking-wide`, ícones 10px Lucide, sem misturar bullets).
- **Linha 2 — título** `text-[22px] font-bold leading-tight` (1 linha, truncate).
- **Linha 3 — preço** `text-[15px] font-medium text-white/70` (secundário, não compete com título).
- **Linha 4 — affordance "Ver detalhes"**: pílula minimalista centralizada `text-[11px] uppercase tracking-widest` com chevron animando (`animate-bounce` sutil). Tap area generosa.
- "Compatível com X" continua como linha extra acima das tags quando aplicável, com cyan no nome.

### 3. Botões Hypou / Flopou
- Subir os botões: `bottom: calc(safe-area + 8.5rem)` — garante respiro real do bottom nav.
- **Tamanho**: 64×64 (Apple touch target premium).
- **Liquid Glass + tint semântico sutil**:
  - Flopou: `bg-white/10` + `border-danger/25` + ícone `text-danger/90`.
  - Hypou: `bg-white/10` + `border-primary/30` + ícone `text-primary` + glow externo `shadow-[0_8px_30px_hsl(var(--primary)/0.25)]`.
- Gap 20px entre eles. Active scale 0.92, transição spring.
- Adicionar microlabel opcional abaixo (`text-[9px] uppercase text-white/50`) "Flopou" / "Hypou" — reforça aprendizado da marca.

### 4. Topo do card (chrome)
- **Owner chip**: rating com 1 decimal (`5.0`), truncate no nome em 14ch, ícone Star com fill consistente.
- **Pagination dots**: container com `bg-black/35 backdrop-blur-md` pra contraste em qualquer foto.
- **Share button**: mesmo material que owner chip, mesmo raio, mesma sombra.
- `from-black/35 via-black/15 to-transparent h-20` no topo — apenas pra legibilidade do chrome.

### 5. Estados de drag (manter, polir)
- Stamps "HYPOU"/"FLOPOU" e glow já existem — manter. Reduzir border de 4px → 3px e font-size 5xl → 4xl pra refinar.
- Snap de retorno mais firme: `stiffness: 700, damping: 28`.

### 6. Tokens & consistência
- Raios: card `rounded-[24px]`, painel inferior herda os 24px nas bordas inferiores, botões `rounded-full`, bottom nav já é pill — todos batem.
- Bordas Liquid Glass padrão: `border-white/10` (3-4% conforme guia do projeto).
- Sombra padrão do card: `0 12px 40px rgba(0,0,0,0.35)` no light, sem sombra no dark (já existe).

### 7. Acessibilidade & toque
- Tap target mínimo 44px em todos os chips clicáveis.
- `aria-label` claros: "Curtir item", "Recusar item", "Ver detalhes do item".
- Conflito swipe vs tap: área de "Ver detalhes" só na pílula central, não no painel inteiro (evita conflitar com drag).

### Arquivos a tocar
- `src/components/SwipeCard.tsx` — reestrutura imagem + painel + chrome topo.
- `src/pages/Explorar.tsx` — ajusta `pb` do main e posição/estilo dos botões flutuantes.
- `documentacao.md` — registrar nova anatomia do card.

### Detalhes técnicos
- Substituir `object-contain object-top` por `object-cover object-center` no `<img>` principal e remover o `<img blur>` redundante (não é mais necessário com cover).
- Remover gradient `h-[26rem]`; substituir por: gradient topo `h-20 from-black/35`, e painel inferior como elemento real (não gradient).
- Painel: `absolute inset-x-0 bottom-0 rounded-b-[24px] bg-white/8 dark:bg-black/40 backdrop-blur-2xl border-t border-white/10`.
- Fade entre imagem e painel: pseudo-elemento `h-6 -mt-6` com `bg-gradient-to-b from-transparent to-black/40` por cima da junção.
- Botões: usar `hsl(var(--primary)/0.3)` e `hsl(var(--danger)/0.25)` como border, mantendo fill `bg-white/10 backdrop-blur-2xl`.
