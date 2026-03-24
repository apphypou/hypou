

# Redesign da Tela de Boas-Vindas (Index)

## Problema
A imagem de fundo atual é uma casa de luxo com piscina - completamente desconectada da proposta do Hypou (troca de itens do dia a dia). Transmite aspiração imobiliária, não escambo democrático.

## Direção criativa

Substituir a foto genérica por uma **composição visual abstrata** que comunique o conceito de troca sem depender de uma foto literal. A abordagem:

**Fundo com mesh gradient animado** nas cores da marca (ciano/teal + tons escuros), com elementos flutuantes ilustrativos que reforçam a ideia de "troca" e "match".

### Composição visual proposta

```text
┌─────────────────────────┐
│                         │
│    ↻  📱  🎧  👟       │  ← Ícones/emojis flutuantes
│       ↻     ↻           │    com animação sutil
│  👜    ↻   🎮           │    (float + rotate)
│       ↻                 │
│  ── mesh gradient ──    │    Gradiente radial ciano
│                         │    → escuro nas bordas
├─────────────────────────┤
│ ● TROQUE COM SEGURANÇA  │
│                         │
│ Bem-vindo ao            │
│ Hypou                   │
│                         │
│ Troque o que tá parado  │
│ por algo que você quer.  │
│                         │
│ [ Criar conta  →      ] │
│ [ Entrar              ] │
│                         │
│ Termos · Privacidade    │
└─────────────────────────┘
```

### O que muda

1. **Remover a foto da casa** - substituir por um fundo com gradiente mesh animado (ciano primary → escuro), gerando identidade visual própria sem depender de stock photos.

2. **Adicionar ícones flutuantes** - 6-8 emojis de categorias reais do Hypou (📱🎧👟🎮👜📷) posicionados na metade superior com animação sutil de flutuação (translate Y + leve rotação). Cada um dentro de um círculo glass (bg-white/5, backdrop-blur, border). Isso comunica visualmente "itens variados que podem ser trocados".

3. **Adicionar setas de troca** - 2-3 ícones `Repeat` ou `ArrowLeftRight` discretos entre os itens flutuantes, reforçando o conceito de troca.

4. **Manter todo o conteúdo textual e botões** exatamente como estão - layout inferior inalterado.

5. **Gradiente de fundo** - Dois radial-gradients sobrepostos: um ciano primary com opacidade baixa (15-20%) no centro-topo, e o fundo escuro `hsl(0,0%,11%)` base. Resultado: um glow sutil que dá vida sem poluir.

### Detalhes técnicos

- **Arquivo alterado**: `src/pages/Index.tsx` apenas
- **Dependências**: Nenhuma nova - usa `framer-motion` (já instalado) para animações dos ícones
- **Ícones flutuantes**: Array de objetos `{ emoji, x, y, size, delay, duration }` mapeados como `motion.div` com `animate={{ y: [0, -12, 0], rotate: [0, 5, 0] }}` em loop infinito
- **Containers glass**: `rounded-2xl bg-white/[0.06] backdrop-blur-sm border border-white/[0.08]` com tamanhos variados (40-64px)
- **Performance**: Animações CSS-only via framer-motion `transition: { repeat: Infinity }`, sem re-renders

