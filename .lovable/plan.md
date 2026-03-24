

# Redesign Welcome Screen - Abordagem "Product Preview"

## Problema com as tentativas anteriores

As orbitas abstratas parecem um app de crypto/fintech, nao um app de trocas. Emojis parecem amadores. Nenhuma das duas comunica visualmente o que o app faz para o publico-alvo (jovens querendo trocar coisas).

## Nova direcao: mostrar o proprio produto

Apps como Bumble, Tinder, Depop e Vinted mostram **previews do proprio app** na welcome screen. O usuario entende instantaneamente o que vai encontrar la dentro. A abordagem: exibir **2 cards de itens estilizados sobrepostos** com um icone de troca entre eles, como se fossem um "mini swipe" acontecendo.

```text
┌─────────────────────────┐
│                         │
│     ┌──────┐            │
│     │ 🎧   │ ┌──────┐   │  Cards estilizados
│     │Fone  │ │ 👟   │   │  sobrepostos com
│     │Sony  │ │Tênis │   │  rotação leve
│     │R$200 │ │Nike  │   │  (+3° e -3°)
│     └──────┘ │R$180 │   │
│        ⇄     └──────┘   │  Ícone de swap
│                         │  entre eles
│   glow ciano sutil      │
├─────────────────────────┤
│ ● TROQUE COM SEGURANÇA  │
│                         │
│ Bem-vindo ao Hypou      │
│                         │
│ Troque o que tá parado  │
│                         │
│ [ Criar conta  →      ] │
│ [ Entrar              ] │
│                         │
│ Termos · Privacidade    │
└─────────────────────────┘
```

## O que muda

1. **Remover orbitas, particulas e bgParticles** - eliminar toda a composicao abstrata atual.

2. **Criar 2 mock item cards** sobrepostos no centro-topo da tela. Cada card tera:
   - Um gradiente colorido no topo simulando a foto do item (sem imagem real, apenas gradiente abstrato com um icone Lucide representando a categoria)
   - Nome do item, faixa de preco e um badge de categoria
   - Estilo glass-card com `rounded-2xl`, border sutil, sombra
   - Rotacao leve: card esquerdo `-4deg`, card direito `+4deg`, levemente deslocados

3. **Icone de swap central** - Um `ArrowLeftRight` com glow ciano entre os dois cards, com animacao de pulse sutil.

4. **Manter o glow de fundo** - O mesh gradient ciano fica, mas mais concentrado atras dos cards para dar destaque.

5. **Animacao de entrada** - Cards entram com stagger: o esquerdo desliza da esquerda, o direito da direita, e o icone de swap aparece por ultimo com um leve bounce.

6. **Texto e botoes** - Inalterados, apenas mantidos.

## Detalhes tecnicos

- **Arquivo**: `src/pages/Index.tsx` apenas
- **Icones**: `Headphones`, `Footprints` (ou `Shirt`) e `ArrowLeftRight` do Lucide (ja disponivel)
- **Cards mock**: Componentes inline, nao reutilizaveis - sao apenas para a welcome screen
- **Gradientes dos cards**: Cada card usa um gradiente diferente (um ciano/teal, outro roxo/magenta) para simular fotos de produto de forma abstrata e premium
- **Layout**: Cards posicionados com `absolute` dentro de um container centralizado, com `transform: rotate()` e `translateX()` para o efeito de sobreposicao
- **Animacoes**: `framer-motion` com `initial={{ x: -60, opacity: 0, rotate: -8 }}` e `animate={{ x: 0, opacity: 1, rotate: -4 }}` para entrada natural

